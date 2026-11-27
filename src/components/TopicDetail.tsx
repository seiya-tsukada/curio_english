import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Languages,
  Pause,
  Volume2,
} from 'lucide-react';
import { SentenceItem, Topic, VocabularyItem } from '../types/curio';
import { CATEGORY_MAP, getSentencesByTopic } from '../data';
import { getDifficultyLabel } from '../utils/storage';
import { speakSentence, SpeechController } from '../utils/speech';
import { CategoryImage } from './CategoryImage';
import { InteractiveSentence } from './InteractiveSentence';

interface TopicDetailProps {
  topic: Topic;
  initialOrder?: number;
  savedSentenceIds: string[];
  savedWords: string[];
  onBack: () => void;
  onToggleSaveSentence: (sentenceId: string) => void;
  onToggleSaveWord: (vocab: VocabularyItem, sentenceId: string) => void;
  onOpenSentence: (sentence: SentenceItem) => void;
  onMarkRead: (sentenceId: string, topicId: string) => void;
}

export function TopicDetail({
  topic,
  initialOrder = 1,
  savedSentenceIds,
  savedWords,
  onBack,
  onToggleSaveSentence,
  onToggleSaveWord,
  onOpenSentence,
  onMarkRead,
}: TopicDetailProps) {
  const sentences = getSentencesByTopic(topic.id);
  const startIdx = Math.max(
    0,
    Math.min(sentences.length - 1, initialOrder - 1)
  );
  const [currentIndex, setCurrentIndex] = useState(startIdx);
  const [showTranslation, setShowTranslation] = useState(false);
  const [completedStory, setCompletedStory] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const speechRef = useRef<SpeechController | null>(null);

  const currentSentence = sentences[currentIndex];
  const category = CATEGORY_MAP[topic.categoryId];
  const levelInfo = getDifficultyLabel(topic.difficulty);
  const savedSet = new Set(savedSentenceIds);

  useEffect(() => {
    setCurrentIndex(startIdx);
    setCompletedStory(false);
    setShowTranslation(false);
  }, [topic.id, startIdx]);

  useEffect(() => {
    if (currentSentence) {
      onMarkRead(currentSentence.id, topic.id);
    }
    setShowTranslation(false);
    setIsPlaying(false);
    speechRef.current?.stop();

    return () => {
      speechRef.current?.stop();
    };
  }, [currentSentence?.id]);

  if (!currentSentence) return null;

  const progressPct = Math.round(((currentIndex + 1) / sentences.length) * 100);
  const isCurrentSaved = savedSet.has(currentSentence.id);

  const handlePlay = () => {
    if (isPlaying) {
      speechRef.current?.stop();
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    speechRef.current = speakSentence(currentSentence.english, {
      rate: 0.95,
      onEnd: () => setIsPlaying(false),
    });
  };

  const handleNext = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCompletedStory(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCompletedStory(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-3 -ml-3 rounded-xl text-sm font-medium text-slate-600 hover:text-[#13284B] hover:bg-white inline-flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>もどる</span>
        </button>

        <div className="text-xs font-semibold text-[#13284B] tabular-nums">
          Sentence {currentIndex + 1} / {sentences.length}
        </div>
      </div>

      {/* Topic Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-12 items-stretch">
          <div className="sm:col-span-4 min-h-[150px]">
            <CategoryImage
              categoryId={topic.categoryId}
              alt={topic.titleEn}
              className="w-full h-full"
            />
          </div>
          <div className="sm:col-span-8 p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="font-semibold text-[#13284B]">{category.nameEn}</span>
                <span aria-hidden="true">·</span>
                <span>{levelInfo.en}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">約{topic.estimatedMinutes}分</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#13284B] mt-1.5">
                {topic.titleEn}
              </h1>
              <p className="text-sm text-slate-600 mt-1">{topic.titleJa}</p>
              <p className="text-xs text-slate-500 mt-1">{topic.subtitleJa}</p>
            </div>

            {/* Reading Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span>ストーリー進捗</span>
                <span className="font-semibold text-[#13284B] tabular-nums">
                  {currentIndex + 1} / {sentences.length}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#13284B] rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {sentences.map((s, idx) => {
          const active = idx === currentIndex;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setCompletedStory(false);
                setCurrentIndex(idx);
              }}
              aria-current={active ? 'step' : undefined}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer tabular-nums ${
                active
                  ? 'bg-[#13284B] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Part {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Active Sentence Stage */}
      <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-500 tabular-nums">
            Sentence {currentIndex + 1} of {sentences.length}
          </span>
          <button
            type="button"
            onClick={() => onToggleSaveSentence(currentSentence.id)}
            aria-pressed={isCurrentSaved}
            className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              isCurrentSaved
                ? 'bg-[#13284B] text-white'
                : 'bg-slate-100 text-[#13284B] hover:bg-slate-200'
            }`}
          >
            <Bookmark
              className={`w-3.5 h-3.5 ${isCurrentSaved ? 'fill-current' : ''}`}
              aria-hidden="true"
            />
            <span>{isCurrentSaved ? '保存済み' : 'この文を保存'}</span>
          </button>
        </div>

        <InteractiveSentence
          sentenceId={currentSentence.id}
          english={currentSentence.english}
          vocabulary={currentSentence.vocabulary}
          savedWords={savedWords}
          onToggleSaveWord={onToggleSaveWord}
          size="reader"
        />

        {showTranslation && (
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 space-y-2">
            <p className="text-base text-[#13284B] font-medium leading-relaxed">
              {currentSentence.japanese}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              {currentSentence.explanationJa}
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTranslation((prev) => !prev)}
              aria-expanded={showTranslation}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                showTranslation
                  ? 'bg-[#E9F5DF] text-[#1D3B2A]'
                  : 'bg-[#13284B] text-white hover:bg-[#1E3A6A]'
              }`}
            >
              <Languages className="w-4 h-4" aria-hidden="true" />
              <span>{showTranslation ? '日本語訳を隠す' : '日本語訳を見る'}</span>
            </button>

            <button
              type="button"
              onClick={handlePlay}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold border inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                isPlaying
                  ? 'bg-[#EEF4FF] border-[#3B66D4] text-[#13284B]'
                  : 'bg-white border-slate-200 text-[#13284B] hover:bg-slate-50'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" aria-hidden="true" />
                  <span>停止</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" aria-hidden="true" />
                  <span>音声を聴く</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onOpenSentence(currentSentence)}
              className="min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#3B66D4] hover:bg-[#EEF4FF] transition-colors cursor-pointer"
            >
              単語・解説を詳しく見る
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>前へ</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#13284B] text-white text-xs font-semibold hover:bg-[#1E3A6A] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>
                {currentIndex < sentences.length - 1 ? '次の文へ' : 'ストーリーを完了'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Story Completion Message */}
      {completedStory && (
        <div className="p-5 rounded-3xl bg-[#DCEFD0] text-[#1D3B2A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="text-base font-bold text-[#13284B]">
                5文のストーリーを読み終えました！
              </h2>
              <p className="text-xs text-[#274A34] mt-0.5">
                「{topic.titleJa}」の知識を英語で楽しみながら身につけました。
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#13284B] text-white text-xs font-semibold hover:bg-[#1E3A6A] whitespace-nowrap shrink-0 cursor-pointer"
          >
            別のトピックを探す
          </button>
        </div>
      )}
    </div>
  );
}
