"""Google Gemini. Auth: GEMINI_API_KEY (or GOOGLE_API_KEY). LLM_MODEL is required."""

from __future__ import annotations

from google import genai
from google.genai import errors

from llm import GenerationError, T


class Provider:
    name = "gemini"

    def __init__(self, model: str | None = None) -> None:
        if not model:
            raise GenerationError("Set LLM_MODEL to a Gemini model name to use the gemini provider")
        self.model = model

    def generate(self, prompt: str, schema: type[T]) -> T:
        try:
            response = genai.Client().models.generate_content(
                model=self.model,
                contents=prompt,
                config={"response_mime_type": "application/json", "response_schema": schema},
            )
        except (errors.APIError, ValueError) as error:  # ValueError: missing API key
            raise GenerationError(f"Gemini API error: {error}") from error

        if not isinstance(response.parsed, schema):
            reason = response.candidates[0].finish_reason if response.candidates else "no candidates"
            raise GenerationError(f"Could not parse Gemini's response (finish_reason: {reason})")
        return response.parsed
