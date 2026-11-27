# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "pydantic>=2.14,<3",
#     # LLM SDKs (see llm/): only the selected provider's SDK is imported
#     "anthropic>=2.14,<3",
#     "openai>=3.60,<4",
#     "google-genai>=3.6,<4",
# ]
# ///
"""Generate one new topic with an LLM and write it to content/topics/.

    uv run scripts/generate_topic.py [--category ID] [--date YYYY-MM-DD]
                                     [--provider NAME] [--model NAME] [--dry-run]

The LLM is chosen by --provider/--model or LLM_PROVIDER/LLM_MODEL (default:
Claude); see llm/__init__.py. This script only checks what it is responsible for
(ids, sentence count, duplicates). The full schema lives in
src/content/schema.ts (Zod) and is enforced by `npm test` / `npm run build`,
which the workflow runs right after this script.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Literal, get_args
from zoneinfo import ZoneInfo

from pydantic import BaseModel, Field

from llm import GenerationError, LLMProvider, get_provider

TOPICS_DIR = Path(__file__).resolve().parent.parent / "content" / "topics"
SENTENCES_PER_TOPIC = 5

CategoryId = Literal[
    "space-science",
    "technology",
    "history",
    "world-culture",
    "business-economy",
    "human-psychology",
]
Difficulty = Literal["beginner", "elementary", "intermediate"]

CATEGORY_LABELS: dict[str, str] = {
    "space-science": "Space & Science (nature, animals, space, everyday science)",
    "technology": "Technology (gadgets, the internet, how everyday tech works)",
    "history": "History (origins of everyday things, turning points in history)",
    "world-culture": "World & Culture (customs and daily life around the world)",
    "business-economy": "Business & Economy (how shops, money and trade work)",
    "human-psychology": "Human & Psychology (memory, sleep, emotions, habits)",
}


# What we ask the LLM for. Ids, category, difficulty and dates are set by this script.
class Vocabulary(BaseModel):
    word: str
    pos: str
    meaningJa: str


class UsefulPhrase(BaseModel):
    en: str
    ja: str


class GeneratedSentence(BaseModel):
    english: str
    japanese: str
    additionalInfoEn: str
    additionalInfoJa: str
    difficulty: Difficulty
    estimatedSeconds: int
    vocabulary: list[Vocabulary]
    usefulPhrase: UsefulPhrase
    explanationJa: str


class GeneratedTopic(BaseModel):
    slug: str = Field(description='lowercase-kebab-case English slug, 2-5 words, e.g. "octopus-hearts"')
    titleEn: str
    titleJa: str
    subtitleJa: str
    estimatedMinutes: int
    sentences: list[GeneratedSentence]


def read_topics() -> list[dict]:
    return [json.loads(p.read_text(encoding="utf-8")) for p in sorted(TOPICS_DIR.glob("*.json"))]


def least_used(options: tuple[str, ...], used: list[str]) -> str:
    """The option with the fewest existing topics, in declaration order on ties."""
    counts = Counter(used)
    return min(options, key=lambda option: counts[option])


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def build_prompt(category: str, difficulty: str, existing_titles: list[str], example: dict) -> str:
    titles = "\n".join(f"- {title}" for title in existing_titles)
    return f"""You write content for Curio, an English micro-reading app for Japanese learners.
Each topic is a short, surprising and factually accurate piece of trivia told in exactly {SENTENCES_PER_TOPIC} English sentences that build on each other like a tiny story.

Write ONE new topic.
- Category: {CATEGORY_LABELS[category]}
- Overall difficulty: {difficulty} (beginner = CEFR A1-A2, elementary = A2-B1, intermediate = B1-B2). Individual sentences may be one level apart.
- Only include facts that are well established. Avoid myths, disputed claims, and anything time-sensitive.
- Each English sentence: one idea, 8-18 words, natural and friendly.
- additionalInfoEn/Ja: one extra fact that deepens the sentence.
- vocabulary: 2-4 words that appear verbatim (same spelling and inflection) in that English sentence; pos is a Japanese part-of-speech label such as 名詞, 動詞, 形容詞, 副詞.
- usefulPhrase: a reusable chunk taken from the sentence.
- explanationJa: a short, gentle grammar or usage note in Japanese.
- titleJa/subtitleJa: natural Japanese. subtitleJa ends with "。".
- estimatedSeconds: 15-30 per sentence. estimatedMinutes: 2 or 3.

Do NOT repeat or closely overlap these existing topics:
{titles}

Here is an existing topic for tone and level (ids and dates are added later, so omit them):
{json.dumps(example, ensure_ascii=False, indent=2)}"""


def generate(llm: LLMProvider, category: str, difficulty: str, topics: list[dict]) -> GeneratedTopic:
    source = next((t for t in topics if t["categoryId"] == category), topics[0])
    example = {k: v for k, v in source.items() if k not in ("id", "publishedAt")}
    example["sentences"] = [{k: v for k, v in s.items() if k != "id"} for s in source["sentences"]]

    prompt = build_prompt(
        category,
        difficulty,
        [f"{t['titleEn']} ({t['titleJa']})" for t in topics],
        example,
    )
    return llm.generate(prompt, GeneratedTopic)


def to_topic_file(generated: GeneratedTopic, category: str, difficulty: str, published_at: str) -> dict:
    slug = slugify(generated.slug)
    if not slug:
        raise GenerationError(f"Invalid slug: {generated.slug!r}")
    if len(generated.sentences) != SENTENCES_PER_TOPIC:
        raise GenerationError(f"Expected {SENTENCES_PER_TOPIC} sentences, got {len(generated.sentences)}")

    return {
        "id": f"topic-{slug}",
        "categoryId": category,
        "titleEn": generated.titleEn,
        "titleJa": generated.titleJa,
        "subtitleJa": generated.subtitleJa,
        "difficulty": difficulty,
        "estimatedMinutes": generated.estimatedMinutes,
        "publishedAt": published_at,
        "sentences": [
            {"id": f"sent-{slug}-{index}", **sentence.model_dump()}
            for index, sentence in enumerate(generated.sentences, start=1)
        ],
    }


def write_github_output(values: dict[str, str]) -> None:
    path = os.environ.get("GITHUB_OUTPUT")
    if not path:
        return
    with open(path, "a", encoding="utf-8") as f:
        for key, value in values.items():
            f.write(f"{key}={value}\n")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--category", choices=get_args(CategoryId), help="default: the category with the fewest topics")
    parser.add_argument("--date", help="publishedAt (YYYY-MM-DD). default: today in JST")
    parser.add_argument("--provider", help="LLM provider (default: $LLM_PROVIDER or claude)")
    parser.add_argument("--model", help="model name (default: $LLM_MODEL or the provider's default)")
    parser.add_argument("--dry-run", action="store_true", help="print the topic instead of writing it")
    args = parser.parse_args()

    topics = read_topics()
    category = args.category or least_used(get_args(CategoryId), [t["categoryId"] for t in topics])
    difficulty = least_used(
        get_args(Difficulty), [t["difficulty"] for t in topics if t["categoryId"] == category]
    )
    published_at = args.date or datetime.now(ZoneInfo("Asia/Tokyo")).date().isoformat()

    llm = get_provider(args.provider, args.model)
    print(f"Generating a {difficulty} topic for {category} (publishedAt {published_at}) with {llm.name}/{llm.model}...")
    topic = to_topic_file(generate(llm, category, difficulty, topics), category, difficulty, published_at)

    path = TOPICS_DIR / f"{topic['id']}.json"
    if path.exists():
        raise RuntimeError(f"{path.name} already exists")
    existing_sentence_ids = {s["id"] for t in topics for s in t["sentences"]}
    if duplicates := existing_sentence_ids & {s["id"] for s in topic["sentences"]}:
        raise RuntimeError(f"Sentence ids already in use: {sorted(duplicates)}")

    content = json.dumps(topic, ensure_ascii=False, indent=2) + "\n"
    if args.dry_run:
        print(content)
        return 0

    path.write_text(content, encoding="utf-8")
    print(f"Wrote content/topics/{path.name}: {topic['titleEn']} / {topic['titleJa']}")
    write_github_output(
        {
            "topic_id": topic["id"],
            "title_en": topic["titleEn"],
            "title_ja": topic["titleJa"],
            "category": category,
            "llm": f"{llm.name}/{llm.model}",
        }
    )
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except RuntimeError as error:  # includes GenerationError
        print(f"error: {error}", file=sys.stderr)
        sys.exit(1)
