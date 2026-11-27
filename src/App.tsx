import { useEffect, useState } from 'react';
import { TOPIC_MAP } from './data';
import type {
  LearningState,
  MainTab,
  SentenceItem,
  UserPreferences,
  VocabularyItem,
} from './types/curio';
import {
  createInitialLearningState,
  getTodayReadCount,
  loadLearningState,
  recordSentenceRead,
  saveLearningState,
  toggleSavedSentence,
  toggleSavedVocab,
} from './utils/storage';
import { AppLayout } from './components/AppLayout';
import { OnboardingFlow } from './components/OnboardingFlow';
import { DiscoveryFeed } from './components/DiscoveryFeed';
import { CategoryGrid } from './components/CategoryGrid';
import { LearningDashboard } from './components/LearningDashboard';
import { ProfileView } from './components/ProfileView';
import { SentenceReader } from './components/SentenceReader';
import { TopicDetail } from './components/TopicDetail';

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

type ActiveDetail =
  | { type: 'none' }
  | { type: 'sentence'; sentence: SentenceItem }
  | { type: 'topic'; topicId: string; startOrder: number };

export default function App() {
  const [state, setState] = useState<LearningState>(loadLearningState);
  const [activeTab, setActiveTab] = useState<MainTab>('discover');
  const [detail, setDetail] = useState<ActiveDetail>({ type: 'none' });

  useEffect(() => {
    saveLearningState(state);
  }, [state]);

  const handleCompleteOnboarding = (prefs: UserPreferences) => {
    setState((prev) => ({
      ...prev,
      preferences: { ...prefs, onboardingCompleted: true },
    }));
    setActiveTab('discover');
    setDetail({ type: 'none' });
  };

  const handleSkipOnboarding = () => {
    setState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, onboardingCompleted: true },
    }));
    setActiveTab('discover');
  };

  const handleSelectTab = (tab: MainTab) => {
    setActiveTab(tab);
    setDetail({ type: 'none' });
    scrollToTop();
  };

  const handleMarkRead = (sentenceId: string, topicId: string) => {
    setState((prev) => recordSentenceRead(prev, sentenceId, topicId));
  };

  const handleToggleSaveSentence = (sentenceId: string) => {
    setState((prev) => toggleSavedSentence(prev, sentenceId));
  };

  const handleToggleSaveWord = (vocab: VocabularyItem, sentenceId: string) => {
    setState((prev) => toggleSavedVocab(prev, vocab, sentenceId));
  };

  const handleOpenSentence = (sentence: SentenceItem) => {
    setDetail({ type: 'sentence', sentence });
    scrollToTop();
  };

  const handleOpenTopic = (topicId: string, startOrder = 1) => {
    setDetail({ type: 'topic', topicId, startOrder });
    scrollToTop();
  };

  if (!state.preferences.onboardingCompleted) {
    return (
      <OnboardingFlow
        initialPreferences={state.preferences}
        onComplete={handleCompleteOnboarding}
        onSkip={handleSkipOnboarding}
      />
    );
  }

  const todayCount = getTodayReadCount(state);
  const savedWords = state.savedVocab.map((v) => v.word);

  return (
    <AppLayout
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
      todayCount={todayCount}
      dailyGoal={state.preferences.dailyGoal}
    >
      {detail.type === 'sentence' ? (
        <SentenceReader
          sentence={detail.sentence}
          isSaved={state.savedSentenceIds.includes(detail.sentence.id)}
          savedWords={savedWords}
          onBack={() => setDetail({ type: 'none' })}
          onSelectSentence={handleOpenSentence}
          onOpenTopic={handleOpenTopic}
          onToggleSaveSentence={handleToggleSaveSentence}
          onToggleSaveWord={handleToggleSaveWord}
          onMarkRead={handleMarkRead}
        />
      ) : detail.type === 'topic' && TOPIC_MAP[detail.topicId] ? (
        <TopicDetail
          topic={TOPIC_MAP[detail.topicId]}
          initialOrder={detail.startOrder}
          savedSentenceIds={state.savedSentenceIds}
          savedWords={savedWords}
          onBack={() => setDetail({ type: 'none' })}
          onToggleSaveSentence={handleToggleSaveSentence}
          onToggleSaveWord={handleToggleSaveWord}
          onOpenSentence={handleOpenSentence}
          onMarkRead={handleMarkRead}
        />
      ) : activeTab === 'discover' ? (
        <DiscoveryFeed
          state={state}
          onDismissBanner={() =>
            setState((prev) => ({ ...prev, bannerDismissed: true }))
          }
          onToggleSaveSentence={handleToggleSaveSentence}
          onToggleSaveWord={handleToggleSaveWord}
          onOpenSentence={handleOpenSentence}
          onOpenTopic={handleOpenTopic}
          onMarkRead={handleMarkRead}
          onGoToTopics={() => handleSelectTab('topics')}
        />
      ) : activeTab === 'topics' ? (
        <CategoryGrid
          readSentenceIds={state.readSentenceIds}
          onOpenTopic={handleOpenTopic}
        />
      ) : activeTab === 'learning' ? (
        <LearningDashboard
          state={state}
          onOpenSentence={handleOpenSentence}
          onOpenTopic={handleOpenTopic}
          onToggleSaveSentence={handleToggleSaveSentence}
          onToggleSaveWord={handleToggleSaveWord}
          onGoToDiscover={() => handleSelectTab('discover')}
        />
      ) : (
        <ProfileView
          preferences={state.preferences}
          totalReadCount={state.readSentenceIds.length}
          onUpdatePreferences={(preferences) =>
            setState((prev) => ({ ...prev, preferences }))
          }
          onReopenOnboarding={() =>
            setState((prev) => ({
              ...prev,
              preferences: { ...prev.preferences, onboardingCompleted: false },
            }))
          }
          onResetAllData={() => {
            const fresh = createInitialLearningState();
            fresh.preferences.onboardingCompleted = true;
            setState(fresh);
          }}
        />
      )}
    </AppLayout>
  );
}
