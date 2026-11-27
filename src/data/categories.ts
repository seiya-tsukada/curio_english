import { CategoryInfo } from '../types/curio';

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'space-science',
    nameEn: 'Space & Science',
    nameJa: '宇宙・科学',
    shortLabelJa: '科学',
    descriptionJa: '深海の生き物から宇宙の謎まで、自然界の「なるほど」に出会う。',
    image: '/images/space-science.jpg',
    tintBg: 'bg-[#E9F5DF]',
    tintText: 'text-[#1D3B2A]',
  },
  {
    id: 'technology',
    nameEn: 'Technology',
    nameJa: 'テクノロジー',
    shortLabelJa: 'テック',
    descriptionJa: '身近なガジェットやITの裏側にある、賢い仕組みをやさしく解説。',
    image: '/images/technology.jpg',
    tintBg: 'bg-[#EBF2FF]',
    tintText: 'text-[#1E3A8A]',
  },
  {
    id: 'history',
    nameEn: 'History',
    nameJa: '歴史',
    shortLabelJa: '歴史',
    descriptionJa: '塩、コーヒー、道、紙。今日の当たり前をつくった世界の歴史物語。',
    image: '/images/history.jpg',
    tintBg: 'bg-[#FEF3C7]',
    tintText: 'text-[#78350F]',
  },
  {
    id: 'world-culture',
    nameEn: 'World & Culture',
    nameJa: '世界と文化',
    shortLabelJa: '文化',
    descriptionJa: '各国の習慣や暮らしの違いから、世界の面白さを知る旅へ。',
    image: '/images/world-culture.jpg',
    tintBg: 'bg-[#E0F2FE]',
    tintText: 'text-[#0C4A6E]',
  },
  {
    id: 'business-economy',
    nameEn: 'Business & Economy',
    nameJa: 'ビジネス・経済',
    shortLabelJa: 'ビジネス',
    descriptionJa: 'スーパーの棚から世界の物流まで、毎日の経済の仕組みが見えてくる。',
    image: '/images/business-economy.jpg',
    tintBg: 'bg-[#F3F0FF]',
    tintText: 'text-[#4C1D95]',
  },
  {
    id: 'human-psychology',
    nameEn: 'Human & Psychology',
    nameJa: '人間・心理',
    shortLabelJa: '心理',
    descriptionJa: '記憶、睡眠、笑顔、時間の感覚。自分自身の脳と心の不思議な働き。',
    image: '/images/human-psychology.jpg',
    tintBg: 'bg-[#ECFDF5]',
    tintText: 'text-[#065F46]',
  },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryInfo['id'], CategoryInfo>;
