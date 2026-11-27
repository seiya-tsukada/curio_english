import {
  CategoryId,
  DifficultyLevel,
  LearningState,
  SentenceItem,
  UserPreferences,
} from '../types/curio';

const LEVEL_RANK: Record<DifficultyLevel, number> = {
  beginner: 1,
  elementary: 2,
  intermediate: 3,
};

export function scoreSentence(
  sentence: SentenceItem,
  preferences: UserPreferences,
  state: Pick<
    LearningState,
    'readSentenceIds' | 'savedSentenceIds' | 'viewedTopicIds'
  >,
  savedCategoryCounts: Partial<Record<CategoryId, number>> = {}
): number {
  let score = 0;

  // 1. Selected interest category match (+45)
  if (preferences.interestedCategories.includes(sentence.categoryId)) {
    score += 45;
  }

  // 2. Unread bonus (+40), read sentences drop below unread
  const isRead = state.readSentenceIds.includes(sentence.id);
  if (!isRead) {
    score += 40;
  } else {
    score -= 35;
  }

  // 3. Saved content affinity (+15 if user saved other sentences in this category)
  const catSaves = savedCategoryCounts[sentence.categoryId] ?? 0;
  if (catSaves > 0) {
    score += Math.min(18, catSaves * 6);
  }

  // 4. Difficulty preference + occasional gentle stretch
  const userRank = LEVEL_RANK[preferences.level];
  const itemRank = LEVEL_RANK[sentence.difficulty];
  const diff = itemRank - userRank;

  if (diff === 0) {
    score += 25;
  } else if (diff === 1) {
    // Slightly challenging content gets a respectable boost so it mixes naturally
    score += 14;
  } else if (diff === -1) {
    score += 12;
  } else {
    score += 2;
  }

  // 5. Previously viewed topic affinity vs fresh discovery:
  // Prioritize lead-in sentences (orderInTopic === 1) for fresh topics,
  // or next unread sentence in a viewed topic
  const viewedTopic = state.viewedTopicIds.includes(sentence.topicId);
  if (!viewedTopic && sentence.orderInTopic === 1) {
    score += 12;
  } else if (viewedTopic && !isRead) {
    score += 8;
  }

  // 6. Small deterministic tie-breaker based on sentence order so the feed feels varied
  score -= sentence.orderInTopic * 1.5;

  return score;
}

/**
 * Returns a personalized feed of sentences, optionally filtered by category.
 * Applies a diversity pass so consecutive cards do not repeat the exact same topic
 * when other topics are available.
 */
export function getRecommendedFeed(
  allSentences: SentenceItem[],
  state: LearningState,
  categoryFilter: CategoryId | 'all' = 'all'
): SentenceItem[] {
  const pool =
    categoryFilter === 'all'
      ? allSentences
      : allSentences.filter((s) => s.categoryId === categoryFilter);

  if (pool.length === 0) return [];

  // Count saved categories for affinity
  const savedSet = new Set(state.savedSentenceIds);
  const savedCategoryCounts: Partial<Record<CategoryId, number>> = {};
  for (const item of allSentences) {
    if (savedSet.has(item.id)) {
      savedCategoryCounts[item.categoryId] =
        (savedCategoryCounts[item.categoryId] ?? 0) + 1;
    }
  }

  // Rank candidates
  const scored = pool
    .map((sentence) => ({
      sentence,
      score: scoreSentence(sentence, state.preferences, state, savedCategoryCounts),
    }))
    .sort((a, b) => b.score - a.score);

  // Diversity pass: avoid placing two sentences from the same topic consecutively
  const remaining = scored.map((entry) => entry.sentence);
  const result: SentenceItem[] = [];
  let lastTopicId = '';
  let lastCategoryId = '';

  while (remaining.length > 0) {
    let pickIdx = remaining.findIndex(
      (s) => s.topicId !== lastTopicId && s.categoryId !== lastCategoryId
    );
    if (pickIdx === -1) {
      pickIdx = remaining.findIndex((s) => s.topicId !== lastTopicId);
    }
    if (pickIdx === -1) {
      pickIdx = 0;
    }
    const [picked] = remaining.splice(pickIdx, 1);
    result.push(picked);
    lastTopicId = picked.topicId;
    lastCategoryId = picked.categoryId;
  }

  return result;
}

export function getRelatedSentences(
  current: SentenceItem,
  allSentences: SentenceItem[],
  limit = 3
): SentenceItem[] {
  const sameTopic = allSentences.filter(
    (s) => s.topicId === current.topicId && s.id !== current.id
  );
  const sameCategory = allSentences.filter(
    (s) =>
      s.categoryId === current.categoryId &&
      s.topicId !== current.topicId &&
      s.orderInTopic === 1
  );

  return [...sameTopic, ...sameCategory].slice(0, limit);
}
