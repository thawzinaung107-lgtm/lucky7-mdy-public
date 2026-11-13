import type { ProductSummary } from '@/types/catalog';
import { useI18n } from '@/lib/i18n';
import ProductCard from '@/components/ProductCard';

interface ProductGridProps {
  products: ProductSummary[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  emptyMessage: string;
}

export default function ProductGrid({ products, loading, error, onRetry, emptyMessage }: ProductGridProps) {
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" aria-busy="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="aspect-[3/5] animate-pulse rounded-2xl bg-neutral-200" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-800">{t('loadError')}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-red-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-900 active:scale-95"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-600">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
