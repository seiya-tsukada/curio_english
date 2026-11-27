import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { CategoryId } from '../types/curio';
import { CATEGORY_MAP } from '../data';

interface CategoryImageProps {
  categoryId: CategoryId;
  alt: string;
  className?: string;
}

export function CategoryImage({ categoryId, alt, className = '' }: CategoryImageProps) {
  const [failed, setFailed] = useState(false);
  const category = CATEGORY_MAP[categoryId];

  // Zoom Space & Science cover art edge-to-edge so no outer backdrop margins appear
  const cropAdjustment =
    categoryId === 'space-science'
      ? 'scale-[2.25] object-[50%_48%]'
      : 'object-center';

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#EEF4FF] to-[#E9F5DF] text-[#13284B] p-4 ${className}`}
        role="img"
        aria-label={alt}
      >
        <BookOpen className="w-7 h-7 mb-2 opacity-60" aria-hidden="true" />
        <span className="text-xs font-medium text-center opacity-75">
          {category.nameEn}
        </span>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-slate-100 ${className}`}>
      <img
        src={category.image}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`w-full h-full object-cover transition-transform duration-300 ${cropAdjustment}`}
      />
    </div>
  );
}
