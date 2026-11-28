import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Compass, RotateCw } from 'lucide-react';
import { STORAGE_KEY } from '../utils/storage';

interface MessagePageProps {
  eyebrow: string;
  title: string;
  description: ReactNode;
  children: ReactNode;
}

function MessagePage({ eyebrow, title, description, children }: MessagePageProps) {
  return (
    <div className="max-w-md mx-auto py-16 md:py-24 px-2 text-center">
      <p className="text-xs font-semibold tracking-[0.18em] uppercase text-slate-500">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-serif text-3xl md:text-4xl font-semibold text-[#13284B]">
        {title}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">{description}</p>
      <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
        {children}
      </div>
    </div>
  );
}

const primaryButton =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-lg bg-[#13284B] text-white text-sm font-medium hover:bg-[#1E3A6A] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#13284B]';
const secondaryButton =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-lg border border-slate-300 bg-white text-[#13284B] text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#13284B]';

/** Shown inside the app layout for unknown URLs, unpublished topics, etc. */
export function NotFoundPage({ onGoHome }: { onGoHome: () => void }) {
  return (
    <MessagePage
      eyebrow="404 · Not found"
      title="ページが見つかりません"
      description="URL が間違っているか、記事が公開前・削除済みの可能性があります。"
    >
      <button type="button" onClick={onGoHome} className={primaryButton}>
        <Compass className="w-4 h-4" aria-hidden="true" />
        発見ページへ
      </button>
    </MessagePage>
  );
}

/**
 * Full-screen fallback rendered when the React tree crashes. It deliberately
 * avoids app state and the app layout, since either may be what failed.
 */
export function SorryPage() {
  const handleResetData = () => {
    const ok = window.confirm(
      '保存した単語・文、学習履歴、設定がすべて削除されます。元に戻せません。よろしいですか？'
    );
    if (!ok) return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage may be unavailable; reloading is still the best we can do.
    }
    window.location.assign('/');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#13284B] flex flex-col">
      <header className="h-[52px] md:h-16 bg-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center">
          <a href="/" className="text-xl font-bold tracking-tight text-[#13284B]">
            Curio
          </a>
        </div>
      </header>
      <main className="flex-1 px-4 sm:px-6">
        <MessagePage
          eyebrow="Something went wrong"
          title="問題が発生しました"
          description="申し訳ありません。表示中にエラーが起きました。再読み込みするか、トップページからやり直してください。"
        >
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={primaryButton}
          >
            <RotateCw className="w-4 h-4" aria-hidden="true" />
            再読み込み
          </button>
          <a href="/" className={secondaryButton}>
            トップページへ
          </a>
        </MessagePage>
        <div className="max-w-md mx-auto pb-16 text-center">
          <p className="text-xs leading-relaxed text-slate-500">
            何度やっても直らない場合は、学習データが壊れている可能性があります。
          </p>
          <button
            type="button"
            onClick={handleResetData}
            className="mt-2 text-xs font-medium text-slate-600 underline underline-offset-2 hover:text-[#13284B] cursor-pointer"
          >
            学習データをリセットして再開
          </button>
        </div>
      </main>
    </div>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Curio crashed:', error, info.componentStack);
  }

  render() {
    return this.state.hasError ? <SorryPage /> : this.props.children;
  }
}
