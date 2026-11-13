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
          className="glass-card group flex min-h-32 flex-col justify-between overflow-hidden rounded-[1.75rem] p-5 hover:-translate-y-1"
        >
          <span className="gold-rule h-0.5 w-8 rounded-full" aria-hidden="true" />
          <span className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('categories')}</span>
          <span className="mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-base font-bold text-foreground sm:text-lg">
            <span className="min-w-0">{language === 'my' ? category.nameMy : category.nameEn}</span>
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
