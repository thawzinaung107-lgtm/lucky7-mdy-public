import { Link, useParams } from '@/lib/router';
import { ArrowLeft, ImageOff } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchProductBySlug } from '@/lib/catalog';
import { useAsyncData } from '@/hooks/useAsyncData';
import { formatMmk, getWholesaleOffer } from '@/lib/pricing';
import OrderPicker from '@/components/OrderPicker';

export default function ProductPage() {
  const { slug = '' } = useParams();
  const { t, language } = useI18n();
  const detail = useAsyncData(() => fetchProductBySlug(slug), [slug]);

  if (detail.loading) {
    return <p className="mx-auto max-w-6xl px-4 py-16 text-sm text-neutral-600">{t('loading')}</p>;
  }

  if (detail.error) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-4 py-16">
        <p className="text-sm text-red-800">{t('loadError')}</p>
        <button
          type="button"
          onClick={detail.reload}
          className="rounded-full bg-red-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-900 active:scale-95"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  if (!detail.data) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-16">
        <p className="text-sm text-neutral-700">{t('notFound')}</p>
        <Link to="/shop" className="text-sm font-semibold text-neutral-900 underline-offset-4 hover:underline">
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
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <Link
        to="/shop"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-neutral-700 transition hover:text-neutral-900"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {t('backToShop')}
      </Link>

      <div className="grid gap-8 md:grid-cols-2 md:items-start">
        <div className="aspect-[3/4] overflow-hidden rounded-3xl bg-neutral-100">
          {product.primaryImageUrl ? (
            <img src={product.primaryImageUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-neutral-500">
              <ImageOff size={32} aria-hidden="true" />
              <span className="text-sm">{t('noImage')}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 md:sticky md:top-24">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-bold leading-tight text-neutral-900 md:text-3xl">{name}</h1>
            {summary && <p className="text-sm leading-relaxed text-neutral-700">{summary}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <p className="text-xs text-neutral-600">{t('retailPrice')}</p>
              <p className="text-lg font-bold text-neutral-900">{formatMmk(product.retailPriceMmk)}</p>
            </div>
            {wholesale && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                <p className="text-xs text-neutral-600">{t('wholesaleFrom')}</p>
                <p className="text-lg font-bold text-neutral-900">
                  {formatMmk(wholesale.unitPriceMmk)} <span className="text-xs font-semibold">{t('perPiece')}</span>
                </p>
                <p className="text-xs text-neutral-600">
                  {t('minOrder')}: {wholesale.minQty} {t('pieces')}
                </p>
              </div>
            )}
          </div>
          {wholesale && <p className="text-xs text-neutral-600">{t('wholesaleNote')}</p>}

          <OrderPicker key={product.id} product={product} />
        </div>
      </div>
    </div>
  );
}
