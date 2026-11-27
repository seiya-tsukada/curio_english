import { CATEGORIES, CATEGORY_MAP } from './categories';
import { TOPICS, TOPIC_MAP } from './topics';
import { SENTENCES_PART_1 } from './sentencesPart1';
import { SENTENCES_PART_2 } from './sentencesPart2';
import { SENTENCES_PART_3 } from './sentencesPart3';
import { SentenceItem } from '../types/curio';

export const ALL_SENTENCES: SentenceItem[] = [
  ...SENTENCES_PART_1,
  ...SENTENCES_PART_2,
  ...SENTENCES_PART_3,
];

export const SENTENCE_MAP = Object.fromEntries(
  ALL_SENTENCES.map((s) => [s.id, s])
) as Record<string, SentenceItem>;

export function getSentencesByTopic(topicId: string): SentenceItem[] {
  return ALL_SENTENCES.filter((s) => s.topicId === topicId).sort(
    (a, b) => a.orderInTopic - b.orderInTopic
  );
}

export function getTopicsByCategory(categoryId: string) {
  return TOPICS.filter((t) => t.categoryId === categoryId);
}

export { CATEGORIES, CATEGORY_MAP, TOPICS, TOPIC_MAP };
