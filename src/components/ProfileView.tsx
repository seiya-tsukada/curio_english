import { useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import {
  CategoryId,
  DailyGoal,
  DifficultyLevel,
  UserPreferences,
} from '../types/curio';
import { CATEGORIES } from '../data';
import { DAILY_GOAL_OPTIONS } from '../utils/storage';

interface ProfileViewProps {
  preferences: UserPreferences;
  totalReadCount: number;
  onUpdatePreferences: (prefs: UserPreferences) => void;
  onReopenOnboarding: () => void;
  onResetAllData: () => void;
}

const LEVEL_OPTIONS: { id: DifficultyLevel; en: string; ja: string }[] = [
  { id: 'beginner', en: 'Beginner', ja: '初級（TOEIC 300〜400）' },
  { id: 'elementary', en: 'Elementary', ja: '初中級（TOEIC 400〜500）' },
  { id: 'intermediate', en: 'Intermediate', ja: '中級（TOEIC 500〜）' },
];

export function ProfileView({
  preferences,
  totalReadCount,
  onUpdatePreferences,
  onReopenOnboarding,
  onResetAllData,
}: ProfileViewProps) {
  const [confirmReset, setConfirmReset] = useState(false);

  const toggleCategory = (catId: CategoryId) => {
    const exists = preferences.interestedCategories.includes(catId);
    const nextCats = exists
      ? preferences.interestedCategories.length > 1
        ? preferences.interestedCategories.filter((c) => c !== catId)
        : preferences.interestedCategories
      : [...preferences.interestedCategories, catId];
    onUpdatePreferences({ ...preferences, interestedCategories: nextCats });
  };

  const setLevel = (level: DifficultyLevel) => {
    onUpdatePreferences({ ...preferences, level });
  };

  const setDailyGoal = (dailyGoal: DailyGoal) => {
    onUpdatePreferences({ ...preferences, dailyGoal });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#13284B]">
          Profile · プロフィールと設定
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          興味のある分野や1日の目標を変更すると、発見フィードがすぐ最適化されます。
        </p>
      </div>

      {/* Brand Summary */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex items-center justify-between gap-4">
        <div>
          <p className="text-lg font-bold text-[#13284B]">Curio 学習プロフィール</p>
          <p className="text-xs text-slate-500 mt-0.5">
            これまで読んだ文：{totalReadCount} 文 · ローカル保存モード（アカウント登録不要）
          </p>
        </div>
        <button
          type="button"
          onClick={onReopenOnboarding}
          className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#13284B] hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
        >
          初期設定をやり直す
        </button>
      </div>

      {/* Interested Categories */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
        <h2 className="text-base font-bold text-[#13284B]">興味のあるカテゴリー</h2>
        <p className="text-xs text-slate-500">
          選択したカテゴリーの記事がフィードの上位に届きます。
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {CATEGORIES.map((cat) => {
            const active = preferences.interestedCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                aria-pressed={active}
                className={`min-h-[52px] px-4 py-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#E9F5DF] border-[#84B866] text-[#13284B]'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="text-sm font-semibold">{cat.nameEn}</div>
                  <div className="text-xs text-slate-600">{cat.nameJa}</div>
                </div>
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    active ? 'bg-[#13284B] text-white' : 'border border-slate-300'
                  }`}
                  aria-hidden="true"
                >
                  {active && <Check className="w-3 h-3" />}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* English Level */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
        <h2 className="text-base font-bold text-[#13284B]">英語のレベル</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {LEVEL_OPTIONS.map((item) => {
            const active = preferences.level === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setLevel(item.id)}
                aria-pressed={active}
                className={`min-h-[56px] p-3.5 rounded-2xl border text-left transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#13284B] border-[#13284B] text-white'
                    : 'bg-white border-slate-200 text-[#13284B] hover:bg-slate-50'
                }`}
              >
                <div className="text-sm font-semibold">{item.en}</div>
                <div
                  className={`text-xs mt-0.5 ${
                    active ? 'text-slate-200' : 'text-slate-500'
                  }`}
                >
                  {item.ja}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Daily Goal */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
        <h2 className="text-base font-bold text-[#13284B]">1日のリーディング目標</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {DAILY_GOAL_OPTIONS.map((goal) => {
            const active = preferences.dailyGoal === goal;
            return (
              <button
                key={goal}
                type="button"
                onClick={() => setDailyGoal(goal)}
                aria-pressed={active}
                className={`min-h-[50px] p-3 rounded-2xl border text-center transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#EEF4FF] border-[#3B66D4] text-[#13284B]'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-sm font-bold tabular-nums">{goal} 文 / 日</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Reset */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-[#13284B]">学習データのリセット</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              保存した文・単語や読了履歴を初期状態に戻します。
            </p>
          </div>
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:border-rose-200 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>学習データをリセット</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmReset(false);
                  onResetAllData();
                }}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 cursor-pointer"
              >
                本当にリセットする
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
