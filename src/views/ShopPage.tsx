import { useMemo } from 'react';
import { useSearchParams } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { fetchCategories, fetchPublishedProducts } from '@/lib/catalog';
import { useAsyncData } from '@/hooks/useAsyncData';
import ProductGrid from '@/components/ProductGrid';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { matchesSearch } from '@/lib/shopping';

type SortKey = 'newest' | 'price_asc' | 'price_desc';
const SORT_KEYS: SortKey[] = ['newest', 'price_asc', 'price_desc'];

export default function ShopPage() {
  const { t, language } = useI18n();
  const [params, setParams] = useSearchParams();
  const categories = useAsyncData(fetchCategories, []);
  const products = useAsyncData(fetchPublishedProducts, []);

  const categorySlug = params.get('category') ?? '';
  const query = params.get('q') ?? '';
  const sortParam = params.get('sort');
  const sort: SortKey = SORT_KEYS.includes(sortParam as SortKey) ? (sortParam as SortKey) : 'newest';

  const activeCategory = categories.data?.find((category) => category.slug === categorySlug) ?? null;

  const visibleProducts = useMemo(() => {
    const list = products.data ?? [];
    const filtered = list.filter((product) => (!activeCategory || product.categoryId === activeCategory.id) && matchesSearch(product, query));
    if (sort === 'price_asc') return [...filtered].sort((a, b) => a.retailPriceMmk - b.retailPriceMmk);
    if (sort === 'price_desc') return [...filtered].sort((a, b) => b.retailPriceMmk - a.retailPriceMmk);
    return filtered;
  }, [products.data, activeCategory, sort, query]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const chipClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95 ${
      active
        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/15'
        : 'glass-pill text-foreground hover:bg-secondary/70'
    }`;

  const sortLabel: Record<SortKey, string> = {
    newest: t('sortNewest'),
    price_asc: t('sortPriceAsc'),
    price_desc: t('sortPriceDesc'),
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-4 py-10">
      <header className="flex flex-col gap-3">
        <span className="gold-rule h-1 w-12 rounded-full" aria-hidden="true" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{t('shop')}</h1>
      </header>
      <div className="glass-panel flex flex-col gap-4 rounded-[1.75rem] p-4">
        <div className="glass-input grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-3">
          <Search size={18} className="text-muted-foreground" aria-hidden="true" />
          <input type="search" aria-label={t('searchProducts')} placeholder={t('searchPlaceholder')} value={query} onChange={(event) => updateParam('q', event.target.value)} className="min-w-0 bg-transparent py-3 text-sm outline-none" />
          {query && <Button variant="ghost" size="icon" title={t('clearSearch')} aria-label={t('clearSearch')} onClick={() => updateParam('q', '')}><X /></Button>}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label={t('categories')}>
          <Button variant="ghost" type="button" aria-pressed={!activeCategory} className={`${chipClass(!activeCategory)} h-auto shrink-0`} onClick={() => updateParam('category', '')}>
            {t('allCategories')}
          </Button>
          {categories.data?.map((category) => (
            <Button
              variant="ghost"
              key={category.id}
              type="button"
              aria-pressed={activeCategory?.id === category.id}
              className={`${chipClass(activeCategory?.id === category.id)} h-auto shrink-0`}
              onClick={() => updateParam('category', category.slug)}
            >
              {language === 'my' ? category.nameMy : category.nameEn}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <p className="text-xs text-muted-foreground">{!products.loading && t('resultsCount', { n: visibleProducts.length })}</p>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="sr-only">Sort</span>
            <select
              value={sort}
              onChange={(event) => updateParam('sort', event.target.value === 'newest' ? '' : event.target.value)}
              className="glass-input rounded-full px-4 py-2 text-sm text-foreground focus:outline-none"
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
        emptyMessage={query ? t('noSearchResults') : activeCategory ? t('emptyCategory') : t('emptyProducts')}
      />
    </div>
  );
}
