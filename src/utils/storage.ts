import {
  CategoryId,
  DailyGoal,
  DifficultyLevel,
  LearningState,
  SavedVocabItem,
  UserPreferences,
  VocabularyItem,
} from '../types/curio';

export const STORAGE_KEY = 'curio_learning_state_v1';

export const DEFAULT_PREFERENCES: UserPreferences = {
  interestedCategories: ['space-science', 'technology', 'world-culture'],
  level: 'beginner',
  dailyGoal: 10,
  onboardingCompleted: false,
};

export function createInitialLearningState(): LearningState {
  return {
    preferences: { ...DEFAULT_PREFERENCES },
    savedSentenceIds: [],
    savedVocab: [],
    readSentenceIds: [],
    viewedTopicIds: [],
    dailyReadCounts: {},
    readTimestamps: {},
    bannerDismissed: false,
  };
}

export function getTodayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function loadLearningState(storage?: Pick<Storage, 'getItem'>): LearningState {
  const target =
    storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!target) return createInitialLearningState();

  try {
    const raw = target.getItem(STORAGE_KEY);
    if (!raw) return createInitialLearningState();
    const parsed = JSON.parse(raw) as Partial<LearningState>;
    const base = createInitialLearningState();
    return {
      preferences: {
        ...base.preferences,
        ...(parsed.preferences ?? {}),
        interestedCategories: Array.isArray(parsed.preferences?.interestedCategories)
          ? (parsed.preferences!.interestedCategories as CategoryId[])
          : base.preferences.interestedCategories,
      },
      savedSentenceIds: Array.isArray(parsed.savedSentenceIds)
        ? parsed.savedSentenceIds
        : [],
      savedVocab: Array.isArray(parsed.savedVocab) ? parsed.savedVocab : [],
      readSentenceIds: Array.isArray(parsed.readSentenceIds)
        ? parsed.readSentenceIds
        : [],
      viewedTopicIds: Array.isArray(parsed.viewedTopicIds)
        ? parsed.viewedTopicIds
        : [],
      dailyReadCounts:
        parsed.dailyReadCounts && typeof parsed.dailyReadCounts === 'object'
          ? parsed.dailyReadCounts
          : {},
      readTimestamps:
        parsed.readTimestamps && typeof parsed.readTimestamps === 'object'
          ? parsed.readTimestamps
          : {},
      bannerDismissed: Boolean(parsed.bannerDismissed),
    };
  } catch {
    return createInitialLearningState();
  }
}

export function saveLearningState(
  state: LearningState,
  storage?: Pick<Storage, 'setItem'>
): void {
  const target =
    storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!target) return;
  try {
    target.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors gracefully
  }
}

export function recordSentenceRead(
  state: LearningState,
  sentenceId: string,
  topicId: string,
  now: Date = new Date()
): LearningState {
  const todayKey = getTodayKey(now);
  const alreadyRead = state.readSentenceIds.includes(sentenceId);

  const nextReadIds = alreadyRead
    ? state.readSentenceIds
    : [sentenceId, ...state.readSentenceIds];

  const nextViewedTopics = state.viewedTopicIds.includes(topicId)
    ? state.viewedTopicIds
    : [topicId, ...state.viewedTopicIds.filter((id) => id !== topicId)];

  // Move viewed topic to top even if previously viewed
  const orderedViewedTopics = [
    topicId,
    ...nextViewedTopics.filter((id) => id !== topicId),
  ];

  const nextDailyCounts = {
    ...state.dailyReadCounts,
    [todayKey]: (state.dailyReadCounts[todayKey] ?? 0) + (alreadyRead ? 0 : 1),
  };

  return {
    ...state,
    readSentenceIds: nextReadIds,
    viewedTopicIds: orderedViewedTopics,
    dailyReadCounts: nextDailyCounts,
    readTimestamps: {
      ...state.readTimestamps,
      [sentenceId]: now.toISOString(),
    },
  };
}

export function toggleSavedSentence(
  state: LearningState,
  sentenceId: string
): LearningState {
  const exists = state.savedSentenceIds.includes(sentenceId);
  const savedSentenceIds = exists
    ? state.savedSentenceIds.filter((id) => id !== sentenceId)
    : [sentenceId, ...state.savedSentenceIds];
  return { ...state, savedSentenceIds };
}

export function toggleSavedVocab(
  state: LearningState,
  vocab: VocabularyItem,
  sentenceId: string,
  now: Date = new Date()
): LearningState {
  const key = vocab.word.toLowerCase();
  const exists = state.savedVocab.some((v) => v.word.toLowerCase() === key);
  const savedVocab: SavedVocabItem[] = exists
    ? state.savedVocab.filter((v) => v.word.toLowerCase() !== key)
    : [
        {
          word: vocab.word,
          meaningJa: vocab.meaningJa,
          pos: vocab.pos,
          sentenceId,
          savedAt: now.toISOString(),
        },
        ...state.savedVocab,
      ];
  return { ...state, savedVocab };
}

export function getTodayReadCount(
  state: LearningState,
  now: Date = new Date()
): number {
  return state.dailyReadCounts[getTodayKey(now)] ?? 0;
}

export interface DayActivity {
  dateKey: string;
  labelJa: string;
  count: number;
  isToday: boolean;
}

const WEEKDAY_JA = ['日', '月', '火', '水', '木', '金', '土'];

export function getWeeklyActivity(
  state: LearningState,
  now: Date = new Date()
): DayActivity[] {
  const todayKey = getTodayKey(now);
  const days: DayActivity[] = [];

  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(now);
    d.setDate(now.getDate() - offset);
    const key = getTodayKey(d);
    days.push({
      dateKey: key,
      labelJa: WEEKDAY_JA[d.getDay()],
      count: state.dailyReadCounts[key] ?? 0,
      isToday: key === todayKey,
    });
  }

  return days;
}

export function getDifficultyLabel(level: DifficultyLevel): {
  en: string;
  ja: string;
} {
  switch (level) {
    case 'beginner':
      return { en: 'Beginner', ja: '初級' };
    case 'elementary':
      return { en: 'Elementary', ja: '初中級' };
    case 'intermediate':
      return { en: 'Intermediate', ja: '中級' };
  }
}

export const DAILY_GOAL_OPTIONS: DailyGoal[] = [5, 10, 20];
