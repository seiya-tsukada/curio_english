"""OpenAI (Responses API). Auth: OPENAI_API_KEY. LLM_MODEL is required."""

from __future__ import annotations

import openai

from llm import GenerationError, T


class Provider:
    name = "openai"

    def __init__(self, model: str | None = None) -> None:
        if not model:
            raise GenerationError("Set LLM_MODEL to an OpenAI model name to use the openai provider")
        self.model = model

    def generate(self, prompt: str, schema: type[T]) -> T:
        try:
            response = openai.OpenAI().responses.parse(
                model=self.model,
                input=prompt,
                text_format=schema,
            )
        except openai.OpenAIError as error:
            raise GenerationError(f"OpenAI API error: {error}") from error

        for item in response.output:
            for content in getattr(item, "content", None) or []:
                if content.type == "refusal":
                    raise GenerationError(f"OpenAI declined the request: {content.refusal}")
        if response.output_parsed is None:
            raise GenerationError(f"Could not parse OpenAI's response (status: {response.status})")
        return response.output_parsed
