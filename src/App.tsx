import { useEffect, useState } from 'react';
import { SENTENCE_MAP, TOPIC_MAP } from './data';
import { sentencePath, tabPath, topicPath, useRouter } from './router';
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
import { NotFoundPage } from './components/ErrorPages';

const SITE_TITLE = 'Curio — Read a little. Learn a lot.';

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export default function App() {
  const [state, setState] = useState<LearningState>(loadLearningState);
  const { route, navigate, goBack } = useRouter();
  // Detail pages keep the tab the user came from highlighted in the navigation.
  const [lastTab, setLastTab] = useState<MainTab>('discover');
  const activeTab = route.name === 'tab' ? route.tab : lastTab;

  const topic = route.name === 'topic' ? TOPIC_MAP[route.topicId] : undefined;
  const sentence =
    route.name === 'sentence' ? SENTENCE_MAP[route.sentenceId] : undefined;

  useEffect(() => {
    saveLearningState(state);
  }, [state]);

  useEffect(() => {
    if (route.name === 'tab') setLastTab(route.tab);
  }, [route]);

  const isNotFound = route.name !== 'tab' && !topic && !sentence;

  useEffect(() => {
    const pageTitle =
      topic?.titleJa ??
      (sentence ? TOPIC_MAP[sentence.topicId]?.titleJa : undefined) ??
      (isNotFound ? 'ページが見つかりません' : undefined);
    document.title = pageTitle ? `${pageTitle} | Curio` : SITE_TITLE;
  }, [topic, sentence, isNotFound]);

  // After onboarding, a deep link (e.g. a shared topic URL) stays where it is;
  // tab pages, including the profile page it may be reopened from, go to Discover.
  const leaveOnboarding = () => {
    if (route.name === 'tab') navigate(tabPath('discover'), { replace: true });
  };

  const handleCompleteOnboarding = (prefs: UserPreferences) => {
    setState((prev) => ({
      ...prev,
      preferences: { ...prefs, onboardingCompleted: true },
    }));
    leaveOnboarding();
  };

  const handleSkipOnboarding = () => {
    setState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, onboardingCompleted: true },
    }));
    leaveOnboarding();
  };

  const handleSelectTab = (tab: MainTab) => {
    navigate(tabPath(tab));
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
    navigate(sentencePath(sentence.id));
    scrollToTop();
  };

  const handleOpenTopic = (topicId: string, startOrder = 1) => {
    navigate(topicPath(topicId, startOrder));
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
  const handleBack = () => goBack(tabPath(lastTab));

  return (
    <AppLayout
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
      todayCount={todayCount}
      dailyGoal={state.preferences.dailyGoal}
    >
      {sentence ? (
        <SentenceReader
          sentence={sentence}
          isSaved={state.savedSentenceIds.includes(sentence.id)}
          savedWords={savedWords}
          onBack={handleBack}
          onSelectSentence={handleOpenSentence}
          onOpenTopic={handleOpenTopic}
          onToggleSaveSentence={handleToggleSaveSentence}
          onToggleSaveWord={handleToggleSaveWord}
          onMarkRead={handleMarkRead}
        />
      ) : topic && route.name === 'topic' ? (
        <TopicDetail
          topic={topic}
          initialOrder={route.startOrder}
          savedSentenceIds={state.savedSentenceIds}
          savedWords={savedWords}
          onBack={handleBack}
          onToggleSaveSentence={handleToggleSaveSentence}
          onToggleSaveWord={handleToggleSaveWord}
          onOpenSentence={handleOpenSentence}
          onMarkRead={handleMarkRead}
        />
      ) : route.name !== 'tab' ? (
        <NotFoundPage onGoHome={() => handleSelectTab('discover')} />
      ) : route.tab === 'discover' ? (
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
      ) : route.tab === 'topics' ? (
        <CategoryGrid
          readSentenceIds={state.readSentenceIds}
          onOpenTopic={handleOpenTopic}
        />
      ) : route.tab === 'learning' ? (
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
