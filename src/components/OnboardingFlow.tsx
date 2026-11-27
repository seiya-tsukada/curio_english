import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import {
  CategoryId,
  DailyGoal,
  DifficultyLevel,
  UserPreferences,
} from '../types/curio';
import { CATEGORIES } from '../data';
import { DAILY_GOAL_OPTIONS } from '../utils/storage';

interface OnboardingFlowProps {
  initialPreferences: UserPreferences;
  onComplete: (prefs: UserPreferences) => void;
  onSkip: () => void;
}

const LEVELS: { id: DifficultyLevel; en: string; ja: string; descJa: string }[] = [
  {
    id: 'beginner',
    en: 'Beginner',
    ja: '初級（TOEIC 300〜400）',
    descJa: '短い1文をゆっくり楽しみたい方へ',
  },
  {
    id: 'elementary',
    en: 'Elementary',
    ja: '初中級（TOEIC 400〜500）',
    descJa: 'やさしい英語で世界の雑学を広げたい方へ',
  },
  {
    id: 'intermediate',
    en: 'Intermediate',
    ja: '中級（TOEIC 500〜）',
    descJa: '少し読み応えのある表現にも挑戦したい方へ',
  },
];

export function OnboardingFlow({
  initialPreferences,
  onComplete,
  onSkip,
}: OnboardingFlowProps) {
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>(
    initialPreferences.interestedCategories.length > 0
      ? initialPreferences.interestedCategories
      : ['space-science', 'technology', 'world-culture']
  );
  const [level, setLevel] = useState<DifficultyLevel>(initialPreferences.level);
  const [dailyGoal, setDailyGoal] = useState<DailyGoal>(initialPreferences.dailyGoal);

  const toggleCategory = (id: CategoryId) => {
    setSelectedCategories((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((c) => c !== id) : prev;
      }
      return [...prev, id];
    });
  };

  const handleStart = () => {
    onComplete({
      interestedCategories: selectedCategories,
      level,
      dailyGoal,
      onboardingCompleted: true,
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#13284B] flex flex-col justify-center py-8 px-4 sm:px-6">
      <div className="max-w-3xl w-full mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10">
        {/* Brand Intro */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-bold tracking-tight text-[#13284B]">Curio</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#13284B] mt-1">
              Read a little. Learn a lot.
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              世界の面白い知識に、英語で出会う。あなたに合わせて最初のフィードを整えます。
            </p>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="min-h-[40px] px-3 py-2 text-xs font-medium text-slate-600 hover:text-[#13284B] underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
          >
            スキップして始める
          </button>
        </div>

        <div className="space-y-8">
          {/* Question 1: Interested Categories */}
          <section aria-labelledby="q1-heading">
            <div className="flex items-baseline justify-between mb-3">
              <h2 id="q1-heading" className="text-base font-semibold text-[#13284B]">
                1. 興味のある分野を教えてください（複数選択可）
              </h2>
              <span className="text-xs text-slate-500 tabular-nums">
                {selectedCategories.length}件選択中
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {CATEGORIES.map((cat) => {
                const selected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    aria-pressed={selected}
                    className={`min-h-[56px] p-3.5 rounded-2xl border text-left transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                      selected
                        ? 'bg-[#E9F5DF] border-[#84B866] text-[#13284B]'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{cat.nameEn}</div>
                      <div className="text-xs text-slate-600 truncate">{cat.nameJa}</div>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        selected
                          ? 'bg-[#13284B] text-white'
                          : 'border border-slate-300 bg-white'
                      }`}
                      aria-hidden="true"
                    >
                      {selected && <Check className="w-3 h-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Question 2: English Level */}
          <section aria-labelledby="q2-heading">
            <h2 id="q2-heading" className="text-base font-semibold text-[#13284B] mb-3">
              2. 今の英語レベルはどれに近いですか？
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {LEVELS.map((item) => {
                const active = level === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLevel(item.id)}
                    aria-pressed={active}
                    className={`min-h-[64px] p-3.5 rounded-2xl border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#13284B] border-[#13284B] text-white'
                        : 'bg-white border-slate-200 text-[#13284B] hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-sm font-semibold">{item.en}</div>
                    <div
                      className={`text-xs mt-0.5 ${
                        active ? 'text-slate-200' : 'text-slate-600'
                      }`}
                    >
                      {item.ja}
                    </div>
                    <div
                      className={`text-[11px] mt-1 ${
                        active ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {item.descJa}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Question 3: Daily Goal */}
          <section aria-labelledby="q3-heading">
            <h2 id="q3-heading" className="text-base font-semibold text-[#13284B] mb-3">
              3. 1日に何文くらい読んでみたいですか？
            </h2>
            <div className="grid grid-cols-3 gap-2.5">
              {DAILY_GOAL_OPTIONS.map((goal) => {
                const active = dailyGoal === goal;
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setDailyGoal(goal)}
                    aria-pressed={active}
                    className={`min-h-[52px] px-4 py-3 rounded-2xl border text-center transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#EEF4FF] border-[#3B66D4] text-[#13284B]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-base font-bold tabular-nums">{goal} sentences</div>
                    <div className="text-xs text-slate-600">
                      {goal === 5
                        ? '約1〜2分・気楽に'
                        : goal === 10
                        ? '約3分・おすすめ'
                        : '約5分・たっぷり'}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            登録は不要です。設定はいつでもプロフィールから変更できます。
          </p>
          <button
            type="button"
            onClick={handleStart}
            className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-[#13284B] text-white text-sm font-semibold hover:bg-[#1E3A6A] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>発見フィードをはじめる</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
