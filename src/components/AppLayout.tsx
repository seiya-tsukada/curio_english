import { ReactNode } from 'react';
import { MainTab } from '../types/curio';
import { BottomNavigation } from './BottomNavigation';

interface AppLayoutProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  todayCount: number;
  dailyGoal: number;
  children: ReactNode;
}

const DESKTOP_TABS: { id: MainTab; label: string; labelJa: string }[] = [
  { id: 'discover', label: 'Discover', labelJa: '発見' },
  { id: 'topics', label: 'Topics', labelJa: 'トピック' },
  { id: 'learning', label: 'My Learning', labelJa: 'マイ学習' },
  { id: 'profile', label: 'Profile', labelJa: 'プロフィール' },
];

export function AppLayout({
  activeTab,
  onSelectTab,
  todayCount,
  dailyGoal,
  children,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#13284B] flex flex-col">
      {/* Desktop & Mobile Top Header following strict 3-zone contract */}
      <header className="sticky top-0 z-30 h-[52px] md:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line brand wordmark */}
          <button
            type="button"
            onClick={() => onSelectTab('discover')}
            className="text-xl font-bold tracking-tight text-[#13284B] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#13284B] rounded"
          >
            Curio
          </button>

          {/* Zone 2: Clean single-line text nav links (Desktop) */}
          <nav
            aria-label="デスクトップナビゲーション"
            className="hidden md:flex items-center gap-7"
          >
            {DESKTOP_TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`py-1 text-sm whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#13284B] ${
                    active
                      ? 'border-[#13284B] font-semibold text-[#13284B]'
                      : 'border-transparent font-medium text-slate-600 hover:text-[#13284B] hover:border-slate-300'
                  }`}
                >
                  {tab.label} · {tab.labelJa}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single primary action showing today's goal progress */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => onSelectTab('learning')}
              aria-label={`今日の目標 ${todayCount}/${dailyGoal}文`}
              className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-[#13284B] text-white text-xs font-medium hover:bg-[#1E3A6A] transition-colors whitespace-nowrap shrink-0 tabular-nums cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#13284B]"
            >
              Today {todayCount} / {dailyGoal}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-24 md:py-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onSelectTab={onSelectTab} />
    </div>
  );
}
