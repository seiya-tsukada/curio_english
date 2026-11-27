export type CategoryId =
  | 'space-science'
  | 'technology'
  | 'history'
  | 'world-culture'
  | 'business-economy'
  | 'human-psychology';

export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate';

export type DailyGoal = 5 | 10 | 20;

export type MainTab = 'discover' | 'topics' | 'learning' | 'profile';

export interface VocabularyItem {
  word: string;
  pos: string;
  meaningJa: string;
  readingNote?: string;
}

export interface UsefulPhrase {
  en: string;
  ja: string;
}

export interface SentenceItem {
  id: string;
  topicId: string;
  categoryId: CategoryId;
  orderInTopic: number;
  english: string;
  japanese: string;
  additionalInfoEn: string;
  additionalInfoJa: string;
  difficulty: DifficultyLevel;
  estimatedSeconds: number;
  vocabulary: VocabularyItem[];
  usefulPhrase: UsefulPhrase;
  explanationJa: string;
}

export interface Topic {
  id: string;
  categoryId: CategoryId;
  titleEn: string;
  titleJa: string;
  subtitleJa: string;
  difficulty: DifficultyLevel;
  estimatedMinutes: number;
}

export interface CategoryInfo {
  id: CategoryId;
  nameEn: string;
  nameJa: string;
  shortLabelJa: string;
  descriptionJa: string;
  image: string;
  tintBg: string;
  tintText: string;
}

export interface UserPreferences {
  interestedCategories: CategoryId[];
  level: DifficultyLevel;
  dailyGoal: DailyGoal;
  onboardingCompleted: boolean;
}

export interface SavedVocabItem {
  word: string;
  meaningJa: string;
  pos: string;
  sentenceId: string;
  savedAt: string;
}

export interface LearningState {
  preferences: UserPreferences;
  savedSentenceIds: string[];
  savedVocab: SavedVocabItem[];
  readSentenceIds: string[];
  viewedTopicIds: string[];
  dailyReadCounts: Record<string, number>;
  readTimestamps: Record<string, string>;
  bannerDismissed: boolean;
}
