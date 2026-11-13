import { Link, useParams } from '@/lib/router';
import { ArrowLeft } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchProductBySlug } from '@/lib/catalog';
import { useAsyncData } from '@/hooks/useAsyncData';
import { formatMmk, getWholesaleOffer } from '@/lib/pricing';
import OrderPicker from '@/components/OrderPicker';
import ProductImage from '@/components/ProductImage';

export default function ProductPage() {
  const { slug = '' } = useParams();
  const { t, language } = useI18n();
  const detail = useAsyncData(() => fetchProductBySlug(slug), [slug]);

  if (detail.loading) {
    return <p className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted-foreground">{t('loading')}</p>;
  }

  if (detail.error) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-4 py-16">
        <p className="text-sm text-destructive">{t('loadError')}</p>
        <button
          type="button"
          onClick={detail.reload}
          className="rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition hover:bg-destructive/90 active:scale-95"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  if (!detail.data) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-16">
        <p className="text-sm text-muted-foreground">{t('notFound')}</p>
        <Link to="/shop" className="text-sm font-semibold text-foreground underline-offset-4 hover:underline">
          {t('backToShop')}
        </Link>
      </div>
    );
  }

  const product = detail.data;
  const name = language === 'my' ? product.nameMy : product.nameEn;
  const summary = language === 'my' ? product.summaryMy : product.summaryEn;
  const wholesale = getWholesaleOffer(product.priceTiers);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 pb-32 lg:pb-10">
      <Link
        to="/shop"
        className="glass-pill mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary/70"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {t('backToShop')}
      </Link>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <ProductImage src={product.primaryImageUrl} name={name} />

        <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-36">
          <div className="flex flex-col gap-3">
            <span className="gold-rule h-1 w-12 rounded-full" aria-hidden="true" />
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground md:text-3xl">{name}</h1>
            {summary && <p className="text-sm leading-relaxed text-muted-foreground">{summary}</p>}
          </div>

          <div className="grid grid-cols-1 items-start gap-3 min-[400px]:grid-cols-2">
            <div className="glass-pill rounded-2xl p-4">
              <p className="text-xs text-muted-foreground">{t('retailPrice')}</p>
              <p className="text-lg font-bold text-foreground">{formatMmk(product.retailPriceMmk)}</p>
            </div>
            {wholesale && (
              <div className="glass-pill rounded-2xl p-4 ring-1 ring-brand-gold/30">
                <p className="text-xs text-muted-foreground">{t('wholesaleFrom')}</p>
                <p className="text-lg font-bold text-foreground">
                  {formatMmk(wholesale.unitPriceMmk)} <span className="text-xs font-semibold">{t('perPiece')}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('minOrder')}: {wholesale.minQty} {t('pieces')}
                </p>
              </div>
            )}
          </div>
          {wholesale && <p className="text-xs text-muted-foreground">{t('wholesaleNote')}</p>}

          <OrderPicker key={product.id} product={product} />
        </div>
      </div>
    </div>
  );
}
