import { useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, BookOpen, Compass, X } from 'lucide-react';
import {
  CategoryId,
  LearningState,
  SentenceItem,
  VocabularyItem,
} from '../types/curio';
import { ALL_SENTENCES, CATEGORIES, TOPICS, TOPIC_MAP } from '../data';
import { getRecommendedFeed } from '../utils/recommendation';
import { getDifficultyLabel, getTodayReadCount } from '../utils/storage';
import { KnowledgeCard } from './KnowledgeCard';

interface DiscoveryFeedProps {
  state: LearningState;
  onDismissBanner: () => void;
  onToggleSaveSentence: (sentenceId: string) => void;
  onToggleSaveWord: (vocab: VocabularyItem, sentenceId: string) => void;
  onOpenSentence: (sentence: SentenceItem) => void;
  onOpenTopic: (topicId: string, startOrder?: number) => void;
  onMarkRead: (sentenceId: string, topicId: string) => void;
  onGoToTopics: () => void;
}

export function DiscoveryFeed({
  state,
  onDismissBanner,
  onToggleSaveSentence,
  onToggleSaveWord,
  onOpenSentence,
  onOpenTopic,
  onMarkRead,
  onGoToTopics,
}: DiscoveryFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [visibleCount, setVisibleCount] = useState(8);
  const [focusIndex, setFocusIndex] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const feed = useMemo(
    () => getRecommendedFeed(ALL_SENTENCES, state, selectedCategory),
    // Keep feed order stable during active reading; re-rank only when category or preferences change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedCategory, state.preferences.interestedCategories, state.preferences.level]
  );

  const visibleFeed = feed.slice(0, visibleCount);
  const savedSet = new Set(state.savedSentenceIds);
  const readSet = new Set(state.readSentenceIds);
  const savedWords = state.savedVocab.map((v) => v.word);
  const todayCount = getTodayReadCount(state);
  const goalProgress = Math.min(
    100,
    Math.round((todayCount / state.preferences.dailyGoal) * 100)
  );
  const userLevel = getDifficultyLabel(state.preferences.level);

  const handleCategoryChange = (cat: CategoryId | 'all') => {
    setSelectedCategory(cat);
    setVisibleCount(8);
    setFocusIndex(0);
  };

  const handleJumpToNext = () => {
    const nextIdx = Math.min(visibleFeed.length - 1, focusIndex + 1);
    if (nextIdx >= visibleCount - 1 && visibleCount < feed.length) {
      setVisibleCount((prev) => Math.min(feed.length, prev + 6));
    }
    setFocusIndex(nextIdx);
    const el = cardRefs.current[nextIdx];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Pick 4 spotlight stories for the desktop right column
  const spotlightTopics = useMemo(() => {
    const preferred = TOPICS.filter((t) =>
      state.preferences.interestedCategories.includes(t.categoryId)
    );
    const pool = preferred.length >= 4 ? preferred : TOPICS;
    return pool.slice(0, 4);
  }, [state.preferences.interestedCategories]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Editorial Header + Reference-inspired Soft Sage Welcome Banner */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-[#13284B]">
            Discover · 今日の発見
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">
            Read a little. Learn a lot. — 気になる1文から世界の知識をのぞいてみよう。
          </p>
        </div>

        <button
          type="button"
          onClick={handleJumpToNext}
          className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-[#13284B] hover:bg-slate-50 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
        >
          <span>次の発見へ</span>
          <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {!state.bannerDismissed && (
        <div
          className="rounded-2xl bg-[#DCEFD0] px-5 py-4 flex items-center justify-between gap-4 text-[#1D3B2A]"
          role="region"
          aria-label="Curioの使い方ヒント"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#274A34]/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-[#1D3B2A]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#13284B]">
                まずは英語のまま1文だけ読んでみよう
              </p>
              <p className="text-xs text-[#274A34] mt-0.5">
                わからない単語は下線をタップ。日本語訳はいつでもワンタップで開けます（レベル設定：{userLevel.en}）。
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismissBanner}
            aria-label="お知らせを閉じる"
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Interactive Category Filter Bar */}
      <div
        className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
        role="tablist"
        aria-label="カテゴリーで絞り込み"
      >
        <button
          type="button"
          role="tab"
          aria-selected={selectedCategory === 'all'}
          onClick={() => handleCategoryChange('all')}
          className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#13284B] text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          おすすめ（すべて）
        </button>
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleCategoryChange(cat.id)}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active
                  ? 'bg-[#13284B] text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat.nameJa}
            </button>
          );
        })}
      </div>

      {/* Main 2-column Desktop Layout (Feed + Editorial Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Feed Stream */}
        <div className="lg:col-span-8 space-y-5">
          {visibleFeed.map((sentence, idx) => {
            const topic = TOPIC_MAP[sentence.topicId];
            if (!topic) return null;
            return (
              <div
                key={sentence.id}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
              >
                <KnowledgeCard
                  sentence={sentence}
                  topic={topic}
                  isSaved={savedSet.has(sentence.id)}
                  isRead={readSet.has(sentence.id)}
                  savedWords={savedWords}
                  onToggleSaveSentence={onToggleSaveSentence}
                  onToggleSaveWord={onToggleSaveWord}
                  onOpenSentence={onOpenSentence}
                  onOpenTopic={onOpenTopic}
                  onMarkRead={onMarkRead}
                  onNextCard={
                    idx < visibleFeed.length - 1
                      ? () => {
                          const target = cardRefs.current[idx + 1];
                          target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      : undefined
                  }
                />
              </div>
            );
          })}

          {visibleCount < feed.length && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => Math.min(feed.length, prev + 8))}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-[#13284B] hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
              >
                さらに発見を読む（残り {feed.length - visibleCount} 文）
              </button>
            </div>
          )}
        </div>

        {/* Desktop Contextual Sidebar */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
          {/* Today's Goal Summary */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#13284B]">今日のリーディング目標</h2>
              <span className="text-xs font-semibold text-slate-500 tabular-nums">
                {todayCount} / {state.preferences.dailyGoal} 文
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-[#13284B] rounded-full transition-all duration-300"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              {todayCount >= state.preferences.dailyGoal
                ? '今日の目標を達成しました！気になったトピックを気ままに読み進めましょう。'
                : `あと ${state.preferences.dailyGoal - todayCount} 文で今日の目標クリアです。1文約20秒で読めます。`}
            </p>
          </div>

          {/* Mini-Stories Quick Picks */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-sm font-bold text-[#13284B]">
                5文で読めるミニストーリー
              </h2>
              <button
                type="button"
                onClick={onGoToTopics}
                className="text-xs font-semibold text-[#3B66D4] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>すべて見る</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {spotlightTopics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => onOpenTopic(topic.id, 1)}
                  className="w-full py-3 first:pt-1 last:pb-1 text-left flex items-start justify-between gap-3 group cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#13284B] group-hover:text-[#3B66D4] transition-colors leading-snug">
                      {topic.titleEn}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {topic.titleJa}
                    </p>
                  </div>
                  <Compass
                    className="w-4 h-4 text-slate-400 group-hover:text-[#3B66D4] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
