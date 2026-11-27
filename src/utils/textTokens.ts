import { VocabularyItem } from '../types/curio';

export interface SentenceToken {
  text: string;
  vocab?: VocabularyItem;
}

/**
 * Splits an English sentence into plain text chunks and clickable vocabulary tokens,
 * keeping surrounding punctuation cleanly outside the interactive word button.
 */
export function tokenizeSentenceWithVocab(
  english: string,
  vocabulary: VocabularyItem[]
): SentenceToken[] {
  if (!vocabulary.length) {
    return [{ text: english }];
  }

  const vocabLookup = new Map<string, VocabularyItem>();
  for (const item of vocabulary) {
    vocabLookup.set(item.word.toLowerCase(), item);
  }

  // Split preserving whitespace and edge punctuation while keeping hyphenated words intact
  const rawParts = english.split(/(\s+)/);
  const tokens: SentenceToken[] = [];

  for (const part of rawParts) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      tokens.push({ text: part });
      continue;
    }

    // Separate leading/trailing punctuation such as quotes, commas, periods, colons
    const match = part.match(/^([“"'(]*?)([A-Za-z0-9'-]+)([.,!?;:"'”)]*)$/);
    if (!match) {
      tokens.push({ text: part });
      continue;
    }

    const [, leading, coreWord, trailing] = match;
    const vocabMatch = vocabLookup.get(coreWord.toLowerCase());

    if (vocabMatch) {
      if (leading) tokens.push({ text: leading });
      tokens.push({ text: coreWord, vocab: vocabMatch });
      if (trailing) tokens.push({ text: trailing });
    } else {
      tokens.push({ text: part });
    }
  }

  return tokens;
}
