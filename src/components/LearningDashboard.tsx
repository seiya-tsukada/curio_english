import { useState } from 'react';
import { ArrowRight, Bookmark, BookOpen, Trash2 } from 'lucide-react';
import { LearningState, SentenceItem, VocabularyItem } from '../types/curio';
import { SENTENCE_MAP, TOPIC_MAP } from '../data';
import { getTodayReadCount, getWeeklyActivity } from '../utils/storage';

interface LearningDashboardProps {
  state: LearningState;
  onOpenSentence: (sentence: SentenceItem) => void;
  onOpenTopic: (topicId: string, startOrder?: number) => void;
  onToggleSaveSentence: (sentenceId: string) => void;
  onToggleSaveWord: (vocab: VocabularyItem, sentenceId: string) => void;
  onGoToDiscover: () => void;
}

type LearningSectionTab = 'sentences' | 'vocab' | 'history';

export function LearningDashboard({
  state,
  onOpenSentence,
  onOpenTopic,
  onToggleSaveSentence,
  onToggleSaveWord,
  onGoToDiscover,
}: LearningDashboardProps) {
  const [sectionTab, setSectionTab] = useState<LearningSectionTab>('sentences');

  const todayCount = getTodayReadCount(state);
  const weekly = getWeeklyActivity(state);
  const maxDayCount = Math.max(5, ...weekly.map((d) => d.count));

  const savedSentences = state.savedSentenceIds
    .map((id) => SENTENCE_MAP[id])
    .filter((s): s is SentenceItem => Boolean(s));

  const readSentences = state.readSentenceIds
    .map((id) => SENTENCE_MAP[id])
    .filter((s): s is SentenceItem => Boolean(s));

  const recentTopics = state.viewedTopicIds
    .map((id) => TOPIC_MAP[id])
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#13284B]">
          My Learning · マイ学習
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          少しずつ読んだ英語の知識が、あなたのストックとして自然に積み上がっています。
        </p>
      </div>

      {/* Encouraging Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500">今日の目標進捗</p>
          <p className="text-3xl font-bold text-[#13284B] mt-1 tabular-nums">
            {todayCount}{' '}
            <span className="text-base font-medium text-slate-500">
              / {state.preferences.dailyGoal} 文
            </span>
          </p>
          <p className="text-xs text-slate-600 mt-2">
            {todayCount >= state.preferences.dailyGoal
              ? '目標クリア！すばらしいペースです。'
              : '1文からでも気軽に読めます。'}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500">これまでに読んだ文</p>
          <p className="text-3xl font-bold text-[#13284B] mt-1 tabular-nums">
            {state.readSentenceIds.length}{' '}
            <span className="text-base font-medium text-slate-500">文</span>
          </p>
          <p className="text-xs text-slate-600 mt-2">
            閲覧したトピック：{recentTopics.length} テーマ
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500">保存したストック</p>
          <p className="text-3xl font-bold text-[#13284B] mt-1 tabular-nums">
            {savedSentences.length}{' '}
            <span className="text-base font-medium text-slate-500">文</span>
            <span className="mx-2 text-slate-300">·</span>
            {state.savedVocab.length}{' '}
            <span className="text-base font-medium text-slate-500">語</span>
          </p>
          <p className="text-xs text-slate-600 mt-2">
            気になった表現をいつでも復習できます。
          </p>
        </div>
      </div>

      {/* Weekly Activity Card */}
      <section
        aria-labelledby="weekly-heading"
        className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="weekly-heading" className="text-base font-bold text-[#13284B]">
            今週のリーディング記録
          </h2>
          <span className="text-xs text-slate-500 tabular-nums">
            目標：{state.preferences.dailyGoal}文 / 日
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-32 pt-4">
          {weekly.map((day) => {
            const heightPct = day.count > 0 ? Math.max(14, Math.round((day.count / maxDayCount) * 100)) : 6;
            return (
              <div key={day.dateKey} className="flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[11px] font-semibold text-slate-600 tabular-nums">
                  {day.count > 0 ? day.count : ''}
                </span>
                <div className="w-full max-w-[36px] flex-1 flex items-end">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-300 ${
                      day.count > 0
                        ? day.isToday
                          ? 'bg-[#13284B]'
                          : 'bg-[#84B866]'
                        : 'bg-slate-100'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span
                  className={`text-xs ${
                    day.isToday ? 'font-bold text-[#13284B]' : 'text-slate-500'
                  }`}
                >
                  {day.labelJa}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recently Viewed Topics */}
      {recentTopics.length > 0 && (
        <section aria-labelledby="recent-topics-heading">
          <h2 id="recent-topics-heading" className="text-base font-bold text-[#13284B] mb-3">
            最近読んだトピック
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentTopics.slice(0, 6).map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => onOpenTopic(topic.id, 1)}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 text-left hover:border-[#13284B]/30 hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#13284B] truncate">
                    {topic.titleEn}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {topic.titleJa}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Segmented Section Selector: Saved Sentences / Saved Vocabulary / Reading History */}
      <div>
        <div
          className="inline-flex items-center p-1 bg-slate-100 rounded-xl"
          role="tablist"
          aria-label="学習ストック切り替え"
        >
          <button
            type="button"
            role="tab"
            aria-selected={sectionTab === 'sentences'}
            onClick={() => setSectionTab('sentences')}
            className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              sectionTab === 'sentences'
                ? 'bg-white text-[#13284B] shadow-xs'
                : 'text-slate-600 hover:text-[#13284B]'
            }`}
          >
            保存した文 ({savedSentences.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sectionTab === 'vocab'}
            onClick={() => setSectionTab('vocab')}
            className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              sectionTab === 'vocab'
                ? 'bg-white text-[#13284B] shadow-xs'
                : 'text-slate-600 hover:text-[#13284B]'
            }`}
          >
            保存した単語 ({state.savedVocab.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sectionTab === 'history'}
            onClick={() => setSectionTab('history')}
            className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              sectionTab === 'history'
                ? 'bg-white text-[#13284B] shadow-xs'
                : 'text-slate-600 hover:text-[#13284B]'
            }`}
          >
            読んだ履歴 ({readSentences.length})
          </button>
        </div>

        {/* Saved Sentences Tab */}
        {sectionTab === 'sentences' && (
          <div className="mt-4 space-y-3">
            {savedSentences.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center">
                <Bookmark className="w-7 h-7 text-slate-300 mx-auto mb-2" aria-hidden="true" />
                <p className="text-sm font-medium text-[#13284B]">
                  まだ保存した英語の文がありません
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  面白いと思った知識カードのブックマークを押すと、ここにまとまります。
                </p>
                <button
                  type="button"
                  onClick={onGoToDiscover}
                  className="mt-4 min-h-[40px] px-5 py-2 rounded-xl bg-[#13284B] text-white text-xs font-semibold cursor-pointer"
                >
                  発見フィードを見る
                </button>
              </div>
            ) : (
              savedSentences.map((sentence) => {
                const topic = TOPIC_MAP[sentence.topicId];
                return (
                  <div
                    key={sentence.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">{topic?.titleJa}</p>
                      <p className="font-serif text-base font-medium text-[#13284B] mt-1">
                        {sentence.english}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">{sentence.japanese}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenSentence(sentence)}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#EEF4FF] text-[#13284B] text-xs font-semibold hover:bg-[#DCE7FE] cursor-pointer"
                      >
                        開く
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleSaveSentence(sentence.id)}
                        aria-label={`「${sentence.english.slice(0, 20)}」の保存を解除`}
                        className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Saved Vocabulary Tab */}
        {sectionTab === 'vocab' && (
          <div className="mt-4">
            {state.savedVocab.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center">
                <BookOpen className="w-7 h-7 text-slate-300 mx-auto mb-2" aria-hidden="true" />
                <p className="text-sm font-medium text-[#13284B]">
                  まだ保存した単語がありません
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  英文の下線が引かれた単語をタップして「単語を保存」を押すと、ここに記録されます。
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {state.savedVocab.map((item) => (
                  <div
                    key={item.word}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-base text-[#13284B]">
                          {item.word}
                        </span>
                        <span className="text-xs text-slate-500">{item.pos}</span>
                      </div>
                      <p className="text-sm text-slate-700 mt-1">{item.meaningJa}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onToggleSaveWord(
                          { word: item.word, pos: item.pos, meaningJa: item.meaningJa },
                          item.sentenceId
                        )
                      }
                      aria-label={`単語「${item.word}」を削除`}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reading History Tab */}
        {sectionTab === 'history' && (
          <div className="mt-4 space-y-2.5">
            {readSentences.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center">
                <p className="text-sm font-medium text-[#13284B]">
                  まだ読んだ履歴がありません
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  気になるカードを1つ開いて読んでみましょう。
                </p>
              </div>
            ) : (
              readSentences.slice(0, 20).map((sentence) => {
                const topic = TOPIC_MAP[sentence.topicId];
                return (
                  <button
                    key={sentence.id}
                    type="button"
                    onClick={() => onOpenSentence(sentence)}
                    className="w-full bg-white rounded-2xl border border-slate-200/80 p-4 text-left hover:border-[#13284B]/30 transition-colors flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">{topic?.titleJa}</p>
                      <p className="font-serif text-sm sm:text-base font-medium text-[#13284B] mt-0.5 truncate">
                        {sentence.english}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
