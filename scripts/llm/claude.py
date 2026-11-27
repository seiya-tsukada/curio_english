"""Anthropic Claude. Auth: ANTHROPIC_API_KEY."""

from __future__ import annotations

import anthropic

from llm import GenerationError, T

DEFAULT_MODEL = "claude-opus-5-5"


class Provider:
    name = "claude"

    def __init__(self, model: str | None = None) -> None:
        self.model = model or DEFAULT_MODEL

    def generate(self, prompt: str, schema: type[T]) -> T:
        try:
            response = anthropic.Anthropic().beta.messages.parse(
                model=self.model,
                max_tokens=16000,
                # Retry on another model if this one declines the request.
                betas=["server-side-fallback-2026-07-01"],
                fallbacks="default",
                output_config={"effort": "high"},
                output_format=schema,
                messages=[{"role": "user", "content": prompt}],
            )
        except anthropic.AnthropicError as error:
            raise GenerationError(f"Claude API error: {error}") from error

        if response.stop_reason == "refusal":
            details = response.stop_details.explanation if response.stop_details else "no details"
            raise GenerationError(f"Claude declined the request: {details}")
        if response.parsed_output is None:
            raise GenerationError(f"Could not parse Claude's response (stop_reason: {response.stop_reason})")
        return response.parsed_output
