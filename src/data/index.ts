import type { TopicFile } from '../content/schema';
import type { CategoryId, SentenceItem, Topic } from '../types/curio';
import { getTodayKey } from '../utils/storage';
import { CATEGORIES, CATEGORY_MAP } from './categories';

// Content is validated against the schema at build time (see vite.config.ts),
// so the files can be used as-is here without shipping Zod to the browser.
const topicFiles = Object.values(
  import.meta.glob<TopicFile>('../../content/topics/*.json', {
    eager: true,
    import: 'default',
  })
);

const categoryOrder = new Map(CATEGORIES.map((c, index) => [c.id, index]));
const today = getTodayKey();

// Topics with a future publishedAt are bundled but stay hidden until that date.
const publishedFiles = topicFiles
  .filter((file) => file.publishedAt <= today)
  .sort(
    (a, b) =>
      categoryOrder.get(a.categoryId)! - categoryOrder.get(b.categoryId)! ||
      b.publishedAt.localeCompare(a.publishedAt) ||
      a.id.localeCompare(b.id)
  );

export const TOPICS: Topic[] = publishedFiles.map(
  ({ sentences: _sentences, ...topic }) => topic
);

export const ALL_SENTENCES: SentenceItem[] = publishedFiles.flatMap((topic) =>
  topic.sentences.map((sentence, index) => ({
    ...sentence,
    topicId: topic.id,
    categoryId: topic.categoryId,
    orderInTopic: index + 1,
  }))
);

export const TOPIC_MAP: Record<string, Topic> = Object.fromEntries(
  TOPICS.map((t) => [t.id, t])
);

export const SENTENCE_MAP: Record<string, SentenceItem> = Object.fromEntries(
  ALL_SENTENCES.map((s) => [s.id, s])
);

export function getSentencesByTopic(topicId: string): SentenceItem[] {
  return ALL_SENTENCES.filter((s) => s.topicId === topicId);
}

export function getTopicsByCategory(categoryId: CategoryId): Topic[] {
  return TOPICS.filter((t) => t.categoryId === categoryId);
}

export { CATEGORIES, CATEGORY_MAP };
