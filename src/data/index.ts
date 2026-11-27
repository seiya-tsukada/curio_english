import type { CategoryId, SentenceItem, Topic } from '../types/curio';
import { CATEGORIES, CATEGORY_MAP } from './categories';
import { TOPICS, TOPIC_MAP } from './topics';
import { SPACE_SCIENCE_SENTENCES } from './sentences/spaceScience';
import { TECHNOLOGY_SENTENCES } from './sentences/technology';
import { HISTORY_SENTENCES } from './sentences/history';
import { WORLD_CULTURE_SENTENCES } from './sentences/worldCulture';
import { BUSINESS_ECONOMY_SENTENCES } from './sentences/businessEconomy';
import { HUMAN_PSYCHOLOGY_SENTENCES } from './sentences/humanPsychology';

export const ALL_SENTENCES: SentenceItem[] = [
  ...SPACE_SCIENCE_SENTENCES,
  ...TECHNOLOGY_SENTENCES,
  ...HISTORY_SENTENCES,
  ...WORLD_CULTURE_SENTENCES,
  ...BUSINESS_ECONOMY_SENTENCES,
  ...HUMAN_PSYCHOLOGY_SENTENCES,
];

export const SENTENCE_MAP: Record<string, SentenceItem> = Object.fromEntries(
  ALL_SENTENCES.map((s) => [s.id, s])
);

export function getSentencesByTopic(topicId: string): SentenceItem[] {
  return ALL_SENTENCES.filter((s) => s.topicId === topicId).sort(
    (a, b) => a.orderInTopic - b.orderInTopic
  );
}

export function getTopicsByCategory(categoryId: CategoryId): Topic[] {
  return TOPICS.filter((t) => t.categoryId === categoryId);
}

export { CATEGORIES, CATEGORY_MAP, TOPICS, TOPIC_MAP };
