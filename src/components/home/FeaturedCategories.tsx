import { Link } from '@/lib/router';
import { ArrowUpRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { Category } from '@/types/catalog';

export default function FeaturedCategories({ categories }: { categories: Category[] }) {
  const { t, language } = useI18n();
  if (categories.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          to={`/shop?category=${category.slug}`}
          className="group flex min-h-28 flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-neutral-900 hover:shadow-md"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">{t('categories')}</span>
          <span className="mt-4 flex items-center justify-between gap-2 text-lg font-bold text-neutral-900">
            {language === 'my' ? category.nameMy : category.nameEn}
            <ArrowUpRight
              size={18}
              aria-hidden="true"
              className="shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </span>
        </Link>
      ))}
    </div>
  );
}
