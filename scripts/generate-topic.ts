/**
 * Generates one new topic with Claude and writes it to content/topics/.
 *
 *   node scripts/generate-topic.ts [--category <id>] [--date YYYY-MM-DD] [--dry-run]
 *
 * Requires ANTHROPIC_API_KEY. The result is validated with the same rules as
 * the build, so an invalid generation never reaches the content directory.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import {
  categoryIdSchema,
  difficultySchema,
  SENTENCES_PER_TOPIC,
  type TopicFile,
} from '../src/content/schema.ts';
import { validateTopicFiles } from '../src/content/validate.ts';

const MODEL = 'claude-opus-5-5';
const TOPICS_DIR = path.resolve(import.meta.dirname, '../content/topics');

const CATEGORY_LABELS: Record<z.infer<typeof categoryIdSchema>, string> = {
  'space-science': 'Space & Science (nature, animals, space, everyday science)',
  technology: 'Technology (gadgets, the internet, how everyday tech works)',
  history: 'History (origins of everyday things, turning points in history)',
  'world-culture': 'World & Culture (customs and daily life around the world)',
  'business-economy': 'Business & Economy (how shops, money and trade work)',
  'human-psychology': 'Human & Psychology (memory, sleep, emotions, habits)',
};

// What we ask Claude for. IDs and dates are assigned by this script.
const generatedTopicSchema = z.object({
  slug: z.string().describe('lowercase-kebab-case English slug, 2-5 words, e.g. "octopus-hearts"'),
  titleEn: z.string(),
  titleJa: z.string(),
  subtitleJa: z.string(),
  estimatedMinutes: z.number().int(),
  sentences: z.array(
    z.object({
      english: z.string(),
      japanese: z.string(),
      additionalInfoEn: z.string(),
      additionalInfoJa: z.string(),
      difficulty: difficultySchema,
      estimatedSeconds: z.number().int(),
      vocabulary: z.array(z.object({ word: z.string(), pos: z.string(), meaningJa: z.string() })),
      usefulPhrase: z.object({ en: z.string(), ja: z.string() }),
      explanationJa: z.string(),
    })
  ),
});

function readTopics(): TopicFile[] {
  return fs
    .readdirSync(TOPICS_DIR)
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(fs.readFileSync(path.join(TOPICS_DIR, name), 'utf8')) as TopicFile);
}

/** Picks the value with the fewest existing topics, in declaration order on ties. */
function leastUsed<T extends string>(options: readonly T[], used: T[]): T {
  const counts = new Map(options.map((o) => [o, 0]));
  for (const value of used) counts.set(value, (counts.get(value) ?? 0) + 1);
  return options.reduce((best, o) => (counts.get(o)! < counts.get(best)! ? o : best));
}

function todayInTokyo(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
}

function buildPrompt(
  category: z.infer<typeof categoryIdSchema>,
  difficulty: z.infer<typeof difficultySchema>,
  existingTitles: string[],
  example: object
): string {
  return `You write content for Curio, an English micro-reading app for Japanese learners.
Each topic is a short, surprising and factually accurate piece of trivia told in exactly ${SENTENCES_PER_TOPIC} English sentences that build on each other like a tiny story.

Write ONE new topic.
- Category: ${CATEGORY_LABELS[category]}
- Overall difficulty: ${difficulty} (beginner = CEFR A1-A2, elementary = A2-B1, intermediate = B1-B2). Individual sentences may be one level apart.
- Only include facts that are well established. Avoid myths, disputed claims, and anything time-sensitive.
- Each English sentence: one idea, 8-18 words, natural and friendly.
- additionalInfoEn/Ja: one extra fact that deepens the sentence.
- vocabulary: 2-4 words that appear verbatim (same spelling and inflection) in that English sentence; pos is a Japanese part-of-speech label such as 名詞, 動詞, 形容詞, 副詞.
- usefulPhrase: a reusable chunk taken from the sentence.
- explanationJa: a short, gentle grammar or usage note in Japanese.
- titleJa/subtitleJa: natural Japanese. subtitleJa ends with "。".
- estimatedSeconds: 15-30 per sentence. estimatedMinutes: 2 or 3.

Do NOT repeat or closely overlap these existing topics:
${existingTitles.map((t) => `- ${t}`).join('\n')}

Here is an existing topic for tone and level (ids and dates are added later, so omit them):
${JSON.stringify(example, null, 2)}`;
}

async function main() {
  const { values } = parseArgs({
    options: {
      category: { type: 'string' },
      date: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
    },
  });

  const topics = readTopics();
  const category = values.category
    ? categoryIdSchema.parse(values.category)
    : leastUsed(categoryIdSchema.options, topics.map((t) => t.categoryId));
  const difficulty = leastUsed(
    difficultySchema.options,
    topics.filter((t) => t.categoryId === category).map((t) => t.difficulty)
  );
  const publishedAt = values.date ?? todayInTokyo();
  const { id: _id, publishedAt: _date, ...example } =
    topics.find((t) => t.categoryId === category) ?? topics[0];
  const exampleForPrompt = {
    ...example,
    sentences: example.sentences.map(({ id: _sentenceId, ...sentence }) => sentence),
  };

  console.log(`Generating a ${difficulty} topic for ${category} (publishedAt ${publishedAt})...`);

  const client = new Anthropic();
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'high', format: betaZodOutputFormat(generatedTopicSchema) },
    messages: [
      {
        role: 'user',
        content: buildPrompt(
          category,
          difficulty,
          topics.map((t) => `${t.titleEn} (${t.titleJa})`),
          exampleForPrompt
        ),
      },
    ],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error(`Generation was refused: ${response.stop_details?.explanation ?? 'no details'}`);
  }
  const generated = response.parsed_output;
  if (!generated) {
    throw new Error(`Could not parse the response (stop_reason: ${response.stop_reason})`);
  }

  const slug = generated.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const topic: TopicFile = {
    id: `topic-${slug}`,
    categoryId: category,
    titleEn: generated.titleEn,
    titleJa: generated.titleJa,
    subtitleJa: generated.subtitleJa,
    difficulty,
    estimatedMinutes: generated.estimatedMinutes,
    publishedAt,
    sentences: generated.sentences.map((sentence, index) => ({
      id: `sent-${slug}-${index + 1}`,
      ...sentence,
    })),
  };

  const fileName = `${topic.id}.json`;
  if (fs.existsSync(path.join(TOPICS_DIR, fileName))) {
    throw new Error(`${fileName} already exists`);
  }

  const errors = validateTopicFiles([
    ...topics.map((t) => ({ fileName: `${t.id}.json`, data: t })),
    { fileName, data: topic },
  ]);
  if (errors.length > 0) {
    throw new Error(`Generated topic is invalid:\n\n${errors.join('\n\n')}`);
  }

  const json = `${JSON.stringify(topic, null, 2)}\n`;
  if (values['dry-run']) {
    console.log(json);
    return;
  }

  fs.writeFileSync(path.join(TOPICS_DIR, fileName), json);
  console.log(`Wrote content/topics/${fileName}: ${topic.titleEn} / ${topic.titleJa}`);

  // Expose details to the GitHub Actions workflow.
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `topic_id=${topic.id}\ntitle_en=${topic.titleEn}\ntitle_ja=${topic.titleJa}\ncategory=${category}\n`
    );
  }
}

main().catch((error: unknown) => {
  if (error instanceof z.ZodError) console.error(z.prettifyError(error));
  else console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
