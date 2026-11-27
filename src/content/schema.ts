import { z } from 'zod';

export const categoryIdSchema = z.enum([
  'space-science',
  'technology',
  'history',
  'world-culture',
  'business-economy',
  'human-psychology',
]);

export const difficultySchema = z.enum(['beginner', 'elementary', 'intermediate']);

const text = z.string().trim().min(1);

export const vocabularySchema = z.object({
  word: text,
  pos: text,
  meaningJa: text,
  readingNote: text.optional(),
});

export const usefulPhraseSchema = z.object({
  en: text,
  ja: text,
});

export const sentenceSchema = z.object({
  id: z.string().regex(/^sent-[a-z0-9-]+$/),
  english: text,
  japanese: text,
  additionalInfoEn: text,
  additionalInfoJa: text,
  difficulty: difficultySchema,
  estimatedSeconds: z.number().int().positive(),
  vocabulary: z.array(vocabularySchema).min(1),
  usefulPhrase: usefulPhraseSchema,
  explanationJa: text,
});

export const SENTENCES_PER_TOPIC = 5;

/** Shape of each file in content/topics/*.json */
export const topicFileSchema = z.object({
  id: z.string().regex(/^topic-[a-z0-9-]+$/),
  categoryId: categoryIdSchema,
  titleEn: text,
  titleJa: text,
  subtitleJa: text,
  difficulty: difficultySchema,
  estimatedMinutes: z.number().int().positive(),
  publishedAt: z.iso.date(),
  sentences: z.array(sentenceSchema).length(SENTENCES_PER_TOPIC),
});

export type TopicFile = z.infer<typeof topicFileSchema>;
