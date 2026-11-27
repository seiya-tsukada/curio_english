import { useState } from 'react';
import { Bookmark, Check, X } from 'lucide-react';
import { VocabularyItem } from '../types/curio';
import { tokenizeSentenceWithVocab } from '../utils/textTokens';

interface InteractiveSentenceProps {
  sentenceId: string;
  english: string;
  vocabulary: VocabularyItem[];
  savedWords: string[];
  onToggleSaveWord: (vocab: VocabularyItem, sentenceId: string) => void;
  size?: 'card' | 'reader';
}

export function InteractiveSentence({
  sentenceId,
  english,
  vocabulary,
  savedWords,
  onToggleSaveWord,
  size = 'card',
}: InteractiveSentenceProps) {
  const [activeVocab, setActiveVocab] = useState<VocabularyItem | null>(null);
  const tokens = tokenizeSentenceWithVocab(english, vocabulary);
  const savedSet = new Set(savedWords.map((w) => w.toLowerCase()));

  const textClass =
    size === 'reader'
      ? 'font-serif text-[23px] sm:text-[26px] leading-[1.6] text-[#13284B]'
      : 'font-serif text-[20px] sm:text-[22px] leading-[1.55] text-[#13284B]';

  return (
    <div>
      <p className={textClass}>
        {tokens.map((token, idx) => {
          if (!token.vocab) {
            return <span key={idx}>{token.text}</span>;
          }
          const isSelected =
            activeVocab?.word.toLowerCase() === token.vocab.word.toLowerCase();
          return (
            <button
              key={idx}
              type="button"
              onClick={() =>
                setActiveVocab(isSelected ? null : token.vocab ?? null)
              }
              aria-expanded={isSelected}
              aria-label={`単語「${token.text}」の意味を見る`}
              className={`inline underline decoration-2 underline-offset-[5px] rounded transition-colors px-0.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#13284B] ${
                isSelected
                  ? 'bg-[#DCEFD0] decoration-[#13284B] text-[#13284B]'
                  : 'decoration-[#13284B]/35 hover:bg-[#E9F5DF] hover:decoration-[#13284B]'
              }`}
            >
              {token.text}
            </button>
          );
        })}
      </p>

      {activeVocab && (
        <div
          className="mt-3 p-3.5 rounded-xl bg-[#F4F8F2] border border-[#CFE3C4] flex items-start justify-between gap-3"
          role="region"
          aria-label={`${activeVocab.word}の意味`}
        >
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-semibold text-base text-[#13284B]">
                {activeVocab.word}
              </span>
              <span className="text-xs text-slate-500">{activeVocab.pos}</span>
            </div>
            <p className="text-sm text-[#1E293B] mt-0.5">{activeVocab.meaningJa}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onToggleSaveWord(activeVocab, sentenceId)}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                savedSet.has(activeVocab.word.toLowerCase())
                  ? 'bg-[#13284B] text-white'
                  : 'bg-white text-[#13284B] border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {savedSet.has(activeVocab.word.toLowerCase()) ? (
                <>
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>保存済み</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>単語を保存</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveVocab(null)}
              aria-label="単語の意味を閉じる"
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-500 hover:text-[#13284B] hover:bg-white/80 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
