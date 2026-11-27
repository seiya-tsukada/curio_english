import { useState } from 'react';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { CategoryId } from '../types/curio';
import { CATEGORIES, CATEGORY_MAP, getTopicsByCategory, TOPICS } from '../data';
import { getDifficultyLabel } from '../utils/storage';
import { CategoryImage } from './CategoryImage';

interface CategoryGridProps {
  readSentenceIds: string[];
  onOpenTopic: (topicId: string, startOrder?: number) => void;
}

export function CategoryGrid({ readSentenceIds, onOpenTopic }: CategoryGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredTopics = normalizedQuery
    ? TOPICS.filter(
        (t) =>
          t.titleEn.toLowerCase().includes(normalizedQuery) ||
          t.titleJa.toLowerCase().includes(normalizedQuery) ||
          t.subtitleJa.toLowerCase().includes(normalizedQuery)
      )
    : selectedCategory
    ? getTopicsByCategory(selectedCategory)
    : [];

  if (selectedCategory || normalizedQuery) {
    const activeCategoryInfo = selectedCategory
      ? CATEGORY_MAP[selectedCategory]
      : null;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchQuery('');
                }}
                className="min-h-[40px] px-2 -ml-2 mb-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-[#13284B] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>すべてのカテゴリーへ</span>
              </button>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-[#13284B]">
              {activeCategoryInfo
                ? `${activeCategoryInfo.nameEn} · ${activeCategoryInfo.nameJa}`
                : 'トピック検索結果'}
            </h1>
            {activeCategoryInfo && (
              <p className="text-sm text-slate-600 mt-1">
                {activeCategoryInfo.descriptionJa}
              </p>
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="トピックを検索..."
              aria-label="トピックを検索"
              className="w-full min-h-[42px] pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-sm text-[#13284B] placeholder:text-slate-400 focus:outline-2 focus:outline-[#13284B]"
            />
          </div>
        </div>

        {filteredTopics.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center">
            <p className="text-sm font-medium text-slate-600">
              該当するトピックが見つかりませんでした。別のキーワードをお試しください。
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-4 min-h-[40px] px-4 py-2 rounded-xl bg-[#13284B] text-white text-xs font-semibold cursor-pointer"
            >
              検索をクリア
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTopics.map((topic) => {
              const level = getDifficultyLabel(topic.difficulty);
              const cat = CATEGORY_MAP[topic.categoryId];
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => onOpenTopic(topic.id, 1)}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#13284B]/30 transition-all overflow-hidden text-left flex flex-col cursor-pointer group"
                >
                  <div className="h-40 w-full">
                    <CategoryImage
                      categoryId={topic.categoryId}
                      alt={topic.titleEn}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="font-semibold text-[#13284B]">{cat.nameEn}</span>
                        <span aria-hidden="true">·</span>
                        <span>{level.en}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">5 sentences</span>
                      </div>
                      <h2 className="text-base font-bold text-[#13284B] mt-2 group-hover:text-[#3B66D4] transition-colors">
                        {topic.titleEn}
                      </h2>
                      <p className="text-xs font-medium text-slate-700 mt-0.5">
                        {topic.titleJa}
                      </p>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {topic.subtitleJa}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#3B66D4]">
                      <span>約{topic.estimatedMinutes}分で読む</span>
                      <span className="inline-flex items-center gap-1">
                        <span>読む</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#13284B]">
            Topics · カテゴリーから探す
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            6つのジャンル・30の知的好奇心ストーリー（全150文）を収録しています。
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="トピックを検索..."
            aria-label="トピックを検索"
            className="w-full min-h-[42px] pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-sm text-[#13284B] placeholder:text-slate-400 focus:outline-2 focus:outline-[#13284B]"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {CATEGORIES.map((category) => {
          const categoryTopics = getTopicsByCategory(category.id);
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#13284B]/30 transition-all overflow-hidden text-left flex flex-col cursor-pointer group"
            >
              <div className="h-44 w-full">
                <CategoryImage
                  categoryId={category.id}
                  alt={category.nameEn}
                  className="w-full h-full"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-[#13284B]">{category.nameJa}</span>
                    <span className="tabular-nums">{categoryTopics.length} topics</span>
                  </div>
                  <h2 className="text-lg font-bold text-[#13284B] mt-1 group-hover:text-[#3B66D4] transition-colors">
                    {category.nameEn}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {category.descriptionJa}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#13284B]">
                  <span>トピックを見る</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#3B66D4]" aria-hidden="true" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* All topics */}
      <section aria-labelledby="all-topics-preview" className="pt-2">
        <div className="flex items-baseline justify-between mb-3">
          <h2 id="all-topics-preview" className="text-base font-bold text-[#13284B]">
            すぐ読める注目トピック
          </h2>
          <span className="text-xs text-slate-500 tabular-nums">
            これまで {readSentenceIds.length} 文読了
          </span>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden">
          {TOPICS.slice(0, 6).map((topic) => {
            const cat = CATEGORY_MAP[topic.categoryId];
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => onOpenTopic(topic.id, 1)}
                className="w-full px-5 py-4 text-left hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>{cat.nameJa}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">5 sentences</span>
                  </div>
                  <p className="text-sm font-semibold text-[#13284B] mt-0.5 truncate">
                    {topic.titleEn}
                  </p>
                  <p className="text-xs text-slate-600 truncate">{topic.titleJa}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
