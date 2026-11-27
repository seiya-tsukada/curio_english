import { Compass, Layers, BookMarked, User } from 'lucide-react';
import { MainTab } from '../types/curio';

interface BottomNavigationProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
}

const NAV_ITEMS: { id: MainTab; labelEn: string; labelJa: string; Icon: typeof Compass }[] = [
  { id: 'discover', labelEn: 'Discover', labelJa: '発見', Icon: Compass },
  { id: 'topics', labelEn: 'Topics', labelJa: 'トピック', Icon: Layers },
  { id: 'learning', labelEn: 'My Learning', labelJa: 'マイ学習', Icon: BookMarked },
  { id: 'profile', labelEn: 'Profile', labelJa: '設定', Icon: User },
];

export function BottomNavigation({ activeTab, onSelectTab }: BottomNavigationProps) {
  return (
    <nav
      aria-label="メインナビゲーション"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80"
    >
      <div className="grid grid-cols-4 h-16 items-center max-w-lg mx-auto">
        {NAV_ITEMS.map(({ id, labelEn, labelJa, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectTab(id)}
              aria-current={active ? 'page' : undefined}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#13284B] ${
                active ? 'text-[#13284B]' : 'text-slate-500 hover:text-[#13284B]'
              }`}
            >
              <Icon
                className={`w-[21px] h-[21px] ${active ? 'stroke-[2.25]' : 'stroke-[1.75]'}`}
                aria-hidden="true"
              />
              <span className={`text-[10px] leading-tight whitespace-nowrap ${active ? 'font-semibold' : 'font-medium'}`}>
                {labelJa}
              </span>
              <span className="sr-only">{labelEn}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
