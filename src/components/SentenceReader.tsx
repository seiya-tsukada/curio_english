import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Languages,
  Pause,
  Play,
} from 'lucide-react';
import { SentenceItem, VocabularyItem } from '../types/curio';
import { ALL_SENTENCES, CATEGORY_MAP, TOPIC_MAP } from '../data';
import { getRelatedSentences } from '../utils/recommendation';
import { getDifficultyLabel } from '../utils/storage';
import { speakSentence, SpeechController } from '../utils/speech';
import { CategoryImage } from './CategoryImage';
import { InteractiveSentence } from './InteractiveSentence';
import { VocabularyCard } from './VocabularyCard';

interface SentenceReaderProps {
  sentence: SentenceItem;
  isSaved: boolean;
  savedWords: string[];
  onBack: () => void;
  onSelectSentence: (sentence: SentenceItem) => void;
  onOpenTopic: (topicId: string, startOrder?: number) => void;
  onToggleSaveSentence: (sentenceId: string) => void;
  onToggleSaveWord: (vocab: VocabularyItem, sentenceId: string) => void;
  onMarkRead: (sentenceId: string, topicId: string) => void;
}

function formatSeconds(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${mins}:${String(rem).padStart(2, '0')}`;
}

export function SentenceReader({
  sentence,
  isSaved,
  savedWords,
  onBack,
  onSelectSentence,
  onOpenTopic,
  onToggleSaveSentence,
  onToggleSaveWord,
  onMarkRead,
}: SentenceReaderProps) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [rate, setRate] = useState<0.85 | 1.0>(1.0);
  const speechRef = useRef<SpeechController | null>(null);

  const topic = TOPIC_MAP[sentence.topicId];
  const category = CATEGORY_MAP[sentence.categoryId];
  const levelInfo = getDifficultyLabel(sentence.difficulty);
  const related = getRelatedSentences(sentence, ALL_SENTENCES, 3);
  const estimatedAudioSec = Math.max(
    3,
    Math.round((sentence.english.split(/\s+/).length * 0.45) / rate)
  );
  const savedWordSet = new Set(savedWords.map((w) => w.toLowerCase()));

  useEffect(() => {
    // Record view & reset audio/translation when switching sentences
    onMarkRead(sentence.id, sentence.topicId);
    setShowTranslation(false);
    setIsPlaying(false);
    setProgress(0);
    setElapsedSec(0);
    speechRef.current?.stop();

    return () => {
      speechRef.current?.stop();
    };
  }, [sentence.id]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      speechRef.current?.stop();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    setProgress(0);
    setElapsedSec(0);
    speechRef.current = speakSentence(sentence.english, {
      rate,
      durationSeconds: estimatedAudioSec,
      onProgress: (p, elapsed) => {
        setProgress(p);
        setElapsedSec(elapsed);
      },
      onEnd: () => {
        setIsPlaying(false);
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto pb-24">
      {/* Top Reader Controls */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-3 -ml-3 rounded-xl text-sm font-medium text-slate-600 hover:text-[#13284B] hover:bg-white inline-flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>もどる</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenTopic(sentence.topicId, sentence.orderInTopic)}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-[#13284B] hover:bg-slate-50 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>ストーリー全体（5文）</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleSaveSentence(sentence.id)}
            aria-pressed={isSaved}
            aria-label={isSaved ? 'この文の保存を解除' : 'この文を保存'}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              isSaved
                ? 'bg-[#13284B] text-white'
                : 'bg-white border border-slate-200 text-[#13284B] hover:bg-slate-50'
            }`}
          >
            <Bookmark
              className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`}
              aria-hidden="true"
            />
            <span>{isSaved ? '保存済み' : '保存する'}</span>
          </button>
        </div>
      </div>

      {/* Main Reader Card */}
      <article className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="h-44 sm:h-56 w-full">
          <CategoryImage
            categoryId={sentence.categoryId}
            alt={topic?.titleEn ?? 'Knowledge illustration'}
            className="w-full h-full"
          />
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Topic Title + Clean Metadata */}
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <span className="font-semibold text-[#13284B]">{category.nameEn}</span>
              <span aria-hidden="true">·</span>
              <span>{topic?.titleJa}</span>
              <span aria-hidden="true">·</span>
              <span>Sentence {sentence.orderInTopic} / 5</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#13284B] mt-2 leading-tight">
              {topic?.titleEn}
            </h1>

            {/* Level indicator */}
            <div className="mt-4 inline-flex items-center p-1 rounded-xl bg-slate-100 text-xs font-medium">
              {(['beginner', 'elementary', 'intermediate'] as const).map((lvl) => {
                const isCurrent = sentence.difficulty === lvl;
                const label = getDifficultyLabel(lvl).en;
                return (
                  <span
                    key={lvl}
                    className={`px-3.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                      isCurrent
                        ? 'bg-[#13284B] text-white font-semibold shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
            <span className="ml-3 text-xs text-slate-500">
              レベル：{levelInfo.ja}
            </span>
          </div>

          {/* Interactive English Prose */}
          <div className="py-2">
            <InteractiveSentence
              sentenceId={sentence.id}
              english={sentence.english}
              vocabulary={sentence.vocabulary}
              savedWords={savedWords}
              onToggleSaveWord={onToggleSaveWord}
              size="reader"
            />
            <p className="text-xs text-slate-500 mt-2">
              下線の単語をタップすると、意味の確認と単語帳への保存ができます。
            </p>
          </div>

          {/* Collapsible Japanese Translation */}
          <div>
            <button
              type="button"
              onClick={() => setShowTranslation((prev) => !prev)}
              aria-expanded={showTranslation}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                showTranslation
                  ? 'bg-[#E9F5DF] text-[#1D3B2A]'
                  : 'bg-[#13284B] text-white hover:bg-[#1E3A6A]'
              }`}
            >
              <Languages className="w-4 h-4" aria-hidden="true" />
              <span>{showTranslation ? '日本語訳を隠す' : '日本語訳を見る'}</span>
            </button>

            {showTranslation && (
              <div className="mt-3 p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 space-y-2">
                <p className="text-base text-[#13284B] font-medium leading-relaxed">
                  {sentence.japanese}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-200/60">
                  <span className="font-semibold text-[#13284B]">豆知識：</span>
                  {sentence.additionalInfoEn}
                  <span className="block text-xs text-slate-500 mt-1">
                    {sentence.additionalInfoJa}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Vocabulary Section */}
          <section aria-labelledby="vocab-heading" className="pt-4 border-t border-slate-100">
            <h2 id="vocab-heading" className="text-sm font-bold text-[#13284B] mb-3">
              重要な単語 · Key Vocabulary
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sentence.vocabulary.map((vocab) => (
                <VocabularyCard
                  key={vocab.word}
                  vocab={vocab}
                  sentenceId={sentence.id}
                  isSaved={savedWordSet.has(vocab.word.toLowerCase())}
                  onToggleSave={onToggleSaveWord}
                />
              ))}
            </div>
          </section>

          {/* Useful Phrase + Gentle Grammar Note */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="p-4 rounded-2xl bg-[#EEF4FF]/70 border border-[#D4E2FC]">
              <p className="text-xs font-semibold text-[#3B66D4]">
                使えるフレーズ · Useful Phrase
              </p>
              <p className="font-serif text-lg font-semibold text-[#13284B] mt-1">
                “{sentence.usefulPhrase.en}”
              </p>
              <p className="text-sm text-slate-700 mt-1">{sentence.usefulPhrase.ja}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F8F2] border border-[#CFE3C4]">
              <p className="text-xs font-semibold text-[#1D3B2A]">
                やさしいポイント · Quick Note
              </p>
              <p className="text-sm text-[#1E293B] mt-1.5 leading-relaxed">
                {sentence.explanationJa}
              </p>
            </div>
          </section>
        </div>
      </article>

      {/* Related Knowledge */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-7">
          <h2 id="related-heading" className="text-base font-bold text-[#13284B] mb-3">
            関連する知識 · Related Knowledge
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {related.map((rel) => {
              const relTopic = TOPIC_MAP[rel.topicId];
              return (
                <button
                  key={rel.id}
                  type="button"
                  onClick={() => onSelectSentence(rel)}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 text-left hover:border-[#13284B]/40 hover:shadow-xs transition-all flex flex-col justify-between gap-3 cursor-pointer"
                >
                  <div>
                    <p className="text-xs text-slate-500 truncate">
                      {relTopic?.titleJa}
                    </p>
                    <p className="font-serif text-sm font-medium text-[#13284B] mt-1.5 line-clamp-3 leading-relaxed">
                      {rel.english}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#3B66D4] inline-flex items-center gap-1">
                    <span>この文を読む</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Audio player */}
      <div
        className="fixed bottom-16 md:bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200"
        role="region"
        aria-label="音声再生コントロール"
      >
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onBack}
            aria-label="一覧に戻る"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#13284B] hover:bg-slate-100 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={isPlaying ? '音声を一時停止' : '英語の音声を再生'}
            className="min-h-[42px] min-w-[42px] rounded-full bg-[#13284B] text-white flex items-center justify-center hover:bg-[#1E3A6A] transition-colors shrink-0 cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" aria-hidden="true" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" aria-hidden="true" />
            )}
          </button>

          <span className="text-xs text-slate-500 tabular-nums shrink-0 w-9 text-right">
            {formatSeconds(elapsedSec)}
          </span>

          {/* Scrubber Track */}
          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-[#13284B] rounded-full transition-all duration-100"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>

          <span className="text-xs text-slate-500 tabular-nums shrink-0 w-9">
            {formatSeconds(estimatedAudioSec)}
          </span>

          <button
            type="button"
            onClick={() => setRate((r) => (r === 1.0 ? 0.85 : 1.0))}
            aria-label="再生速度を切り替え"
            className="min-h-[36px] px-2.5 rounded-lg bg-slate-100 text-xs font-semibold text-[#13284B] hover:bg-slate-200 tabular-nums whitespace-nowrap shrink-0 cursor-pointer"
          >
            {rate === 1.0 ? '1.0x' : '0.85x'}
          </button>
        </div>
      </div>
    </div>
  );
}
