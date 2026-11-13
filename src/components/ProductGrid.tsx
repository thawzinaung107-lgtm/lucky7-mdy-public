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
          <div key={index} className="glass-card aspect-[3/5] animate-pulse rounded-[1.75rem]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel flex flex-col items-start gap-3 rounded-3xl p-6">
        <p className="text-sm text-destructive">{t('loadError')}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition hover:bg-destructive/90 active:scale-95"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="glass-panel rounded-3xl border-dashed p-10 text-center text-sm text-muted-foreground">
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
