import { useMemo } from 'react';
import { useSearchParams } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { fetchCategories, fetchPublishedProducts } from '@/lib/catalog';
import { useAsyncData } from '@/hooks/useAsyncData';
import ProductGrid from '@/components/ProductGrid';

type SortKey = 'newest' | 'price_asc' | 'price_desc';
const SORT_KEYS: SortKey[] = ['newest', 'price_asc', 'price_desc'];

export default function ShopPage() {
  const { t, language } = useI18n();
  const [params, setParams] = useSearchParams();
  const categories = useAsyncData(fetchCategories, []);
  const products = useAsyncData(fetchPublishedProducts, []);

  const categorySlug = params.get('category') ?? '';
  const sortParam = params.get('sort');
  const sort: SortKey = SORT_KEYS.includes(sortParam as SortKey) ? (sortParam as SortKey) : 'newest';

  const activeCategory = categories.data?.find((category) => category.slug === categorySlug) ?? null;

  const visibleProducts = useMemo(() => {
    const list = products.data ?? [];
    const filtered = activeCategory ? list.filter((product) => product.categoryId === activeCategory.id) : list;
    if (sort === 'price_asc') return [...filtered].sort((a, b) => a.retailPriceMmk - b.retailPriceMmk);
    if (sort === 'price_desc') return [...filtered].sort((a, b) => b.retailPriceMmk - a.retailPriceMmk);
    return filtered;
  }, [products.data, activeCategory, sort]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const chipClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95 ${
      active
        ? 'bg-neutral-900 text-white'
        : 'border border-neutral-300 bg-white text-neutral-800 hover:border-neutral-900'
    }`;

  const sortLabel: Record<SortKey, string> = {
    newest: t('sortNewest'),
    price_asc: t('sortPriceAsc'),
    price_desc: t('sortPriceDesc'),
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('categories')}>
          <button type="button" className={chipClass(!activeCategory)} onClick={() => updateParam('category', '')}>
            {t('allCategories')}
          </button>
          {categories.data?.map((category) => (
            <button
              key={category.id}
              type="button"
              className={chipClass(activeCategory?.id === category.id)}
              onClick={() => updateParam('category', category.slug)}
            >
              {language === 'my' ? category.nameMy : category.nameEn}
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <span className="sr-only">Sort</span>
            <select
              value={sort}
              onChange={(event) => updateParam('sort', event.target.value === 'newest' ? '' : event.target.value)}
              className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
            >
              {SORT_KEYS.map((key) => (
                <option key={key} value={key}>
                  {sortLabel[key]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <ProductGrid
        products={visibleProducts}
        loading={products.loading}
        error={products.error}
        onRetry={products.reload}
        emptyMessage={activeCategory ? t('emptyCategory') : t('emptyProducts')}
      />
    </div>
  );
}
