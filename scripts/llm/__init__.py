"""Provider-agnostic interface for asking an LLM for structured (JSON) output.

Callers only depend on `get_provider()` and `LLMProvider.generate()`; which
service is used is configuration:

    LLM_PROVIDER  claude (default) | openai | gemini
    LLM_MODEL     model name; optional for providers that define a default

To add a provider, create `llm/<name>.py` with a `Provider` class that
implements `LLMProvider`, and register it in `PROVIDERS` below.
"""

from __future__ import annotations

import importlib
import os
from typing import Protocol, TypeVar

from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)

# provider name -> module in this package
PROVIDERS: dict[str, str] = {
    "claude": "llm.claude",
    "openai": "llm.openai",
    "gemini": "llm.gemini",
}


class GenerationError(RuntimeError):
    """The provider could not produce a valid result (refusal, parse failure, API error)."""


class LLMProvider(Protocol):
    name: str
    model: str

    def generate(self, prompt: str, schema: type[T]) -> T:
        """Return the model's answer to `prompt`, parsed into `schema`."""
        ...


def get_provider(name: str | None = None, model: str | None = None) -> LLMProvider:
    name = (name or os.environ.get("LLM_PROVIDER") or "claude").lower()
    model = model or os.environ.get("LLM_MODEL") or None
    if name not in PROVIDERS:
        raise GenerationError(f"Unknown LLM provider {name!r}. Choose from: {', '.join(PROVIDERS)}")
    module = importlib.import_module(PROVIDERS[name])
    return module.Provider(model=model)
