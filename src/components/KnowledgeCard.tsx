import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Languages,
  Pause,
  Volume2,
} from 'lucide-react';
import { SentenceItem, Topic, VocabularyItem } from '../types/curio';
import { CATEGORY_MAP } from '../data';
import { getDifficultyLabel } from '../utils/storage';
import { speakSentence, SpeechController } from '../utils/speech';
import { CategoryImage } from './CategoryImage';
import { InteractiveSentence } from './InteractiveSentence';

interface KnowledgeCardProps {
  sentence: SentenceItem;
  topic: Topic;
  isSaved: boolean;
  isRead: boolean;
  savedWords: string[];
  onToggleSaveSentence: (sentenceId: string) => void;
  onToggleSaveWord: (vocab: VocabularyItem, sentenceId: string) => void;
  onOpenSentence: (sentence: SentenceItem) => void;
  onOpenTopic: (topicId: string, startOrder?: number) => void;
  onMarkRead: (sentenceId: string, topicId: string) => void;
  onNextCard?: () => void;
}

export function KnowledgeCard({
  sentence,
  topic,
  isSaved,
  isRead,
  savedWords,
  onToggleSaveSentence,
  onToggleSaveWord,
  onOpenSentence,
  onOpenTopic,
  onMarkRead,
  onNextCard,
}: KnowledgeCardProps) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [showExtraTranslation, setShowExtraTranslation] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const speechRef = useRef<SpeechController | null>(null);

  const category = CATEGORY_MAP[sentence.categoryId];
  const levelLabel = getDifficultyLabel(sentence.difficulty);

  useEffect(() => {
    return () => {
      speechRef.current?.stop();
    };
  }, []);

  const handleToggleTranslation = () => {
    const next = !showTranslation;
    setShowTranslation(next);
    if (next) {
      onMarkRead(sentence.id, sentence.topicId);
    }
  };

  const handleToggleMoreInfo = () => {
    const next = !showMoreInfo;
    setShowMoreInfo(next);
    if (next) {
      onMarkRead(sentence.id, sentence.topicId);
    }
  };

  const handleAudioToggle = () => {
    if (isPlaying) {
      speechRef.current?.stop();
      setIsPlaying(false);
      return;
    }

    onMarkRead(sentence.id, sentence.topicId);
    setIsPlaying(true);
    speechRef.current = speakSentence(sentence.english, {
      rate: 0.95,
      onEnd: () => setIsPlaying(false),
    });
  };

  return (
    <article
      aria-label={topic.titleEn}
      className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden transition-shadow hover:shadow-md"
    >
      {/* Header */}
      <div className="grid grid-cols-1 sm:grid-cols-12 items-stretch">
        <div className="sm:col-span-5 relative h-[152px] sm:h-auto sm:min-h-[220px]">
          <CategoryImage
            categoryId={sentence.categoryId}
            alt={topic.titleEn}
            className="w-full h-full"
          />
        </div>

        <div className="sm:col-span-7 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            {/* Metadata */}
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-[#13284B]">{category.nameEn}</span>
                <span aria-hidden="true">·</span>
                <span>{levelLabel.en}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{sentence.estimatedSeconds}秒</span>
                {isRead && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-700 font-medium">読了</span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => onToggleSaveSentence(sentence.id)}
                aria-label={isSaved ? `${topic.titleEn}の保存を解除` : `${topic.titleEn}を保存`}
                aria-pressed={isSaved}
                className={`min-h-[40px] min-w-[40px] -mr-2 -mt-1 flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
                  isSaved
                    ? 'text-[#13284B] bg-[#E9F5DF]'
                    : 'text-slate-400 hover:text-[#13284B] hover:bg-slate-100'
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`}
                  aria-hidden="true"
                />
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-[#13284B] mt-2 leading-snug">
              {topic.titleEn}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{topic.titleJa}</p>

            {/* Primary English Sentence with tappable underlined vocabulary */}
            <div className="mt-4">
              <InteractiveSentence
                sentenceId={sentence.id}
                english={sentence.english}
                vocabulary={sentence.vocabulary}
                savedWords={savedWords}
                onToggleSaveWord={onToggleSaveWord}
                size="card"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                下線の単語をタップすると意味を確認できます
              </p>
            </div>

            {/* Revealed Japanese Translation */}
            {showTranslation && (
              <div className="mt-3.5 pt-3 border-t border-slate-100">
                <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed">
                  {sentence.japanese}
                </p>
              </div>
            )}

            {/* Expanded Additional Knowledge */}
            {showMoreInfo && (
              <div className="mt-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <p className="text-xs font-semibold text-slate-500">
                  もう少し詳しく · More context
                </p>
                <p className="text-sm text-[#13284B] leading-relaxed font-medium">
                  {sentence.additionalInfoEn}
                </p>
                {showExtraTranslation ? (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {sentence.additionalInfoJa}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowExtraTranslation(true)}
                    className="text-xs font-medium text-[#3B66D4] hover:underline cursor-pointer"
                  >
                    補足の日本語訳を見る
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleToggleTranslation}
                aria-expanded={showTranslation}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  showTranslation
                    ? 'bg-[#E9F5DF] text-[#1D3B2A]'
                    : 'bg-[#13284B] text-white hover:bg-[#1E3A6A]'
                }`}
              >
                <Languages className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{showTranslation ? '日本語訳を隠す' : '日本語訳を見る'}</span>
              </button>

              <button
                type="button"
                onClick={handleAudioToggle}
                aria-label={isPlaying ? '音声を停止' : '英語の音声を再生'}
                className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium border inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isPlaying
                    ? 'bg-[#EEF4FF] border-[#3B66D4] text-[#13284B]'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>再生中</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>音声</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleToggleMoreInfo}
                aria-expanded={showMoreInfo}
                className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>くわしく知る</span>
                {showMoreInfo ? (
                  <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenSentence(sentence)}
                className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold text-[#13284B] hover:bg-slate-100 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                <span>解説・単語</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenTopic(topic.id, sentence.orderInTopic)}
                className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold text-[#3B66D4] hover:bg-[#EEF4FF] inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>続き(5文)</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              {onNextCard && (
                <button
                  type="button"
                  onClick={onNextCard}
                  className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-[#13284B] hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  次へ
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
