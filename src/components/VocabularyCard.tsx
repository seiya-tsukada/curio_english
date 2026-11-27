import { Bookmark, Check } from 'lucide-react';
import { VocabularyItem } from '../types/curio';

interface VocabularyCardProps {
  vocab: VocabularyItem;
  sentenceId: string;
  isSaved: boolean;
  onToggleSave: (vocab: VocabularyItem, sentenceId: string) => void;
}

export function VocabularyCard({
  vocab,
  sentenceId,
  isSaved,
  onToggleSave,
}: VocabularyCardProps) {
  return (
    <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-semibold text-[#13284B] text-base">{vocab.word}</span>
          <span className="text-xs text-slate-500">{vocab.pos}</span>
        </div>
        <p className="text-sm text-slate-700 mt-0.5">{vocab.meaningJa}</p>
      </div>
      <button
        type="button"
        onClick={() => onToggleSave(vocab, sentenceId)}
        aria-label={isSaved ? `単語「${vocab.word}」の保存を解除` : `単語「${vocab.word}」を保存`}
        className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
          isSaved
            ? 'bg-[#13284B] text-white'
            : 'bg-white text-[#13284B] border border-slate-200 hover:bg-slate-100'
        }`}
      >
        {isSaved ? (
          <>
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
            <span>保存済み</span>
          </>
        ) : (
          <>
            <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
            <span>保存</span>
          </>
        )}
      </button>
    </div>
  );
}
