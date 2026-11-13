import { Link } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { formatMmk, getWholesaleOffer } from '@/lib/pricing';
import type { ProductSummary } from '@/types/catalog';

export default function ProductCard({ product }: { product: ProductSummary }) {
  const { t, language } = useI18n();
  const name = language === 'my' ? product.nameMy : product.nameEn;
  const wholesale = getWholesaleOffer(product.priceTiers);

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="aspect-[3/4] overflow-hidden bg-neutral-100">
        <img
          src={product.primaryImageUrl}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-neutral-900">{name}</h3>
        <div className="mt-auto flex flex-col gap-1">
          <p className="text-base font-bold text-neutral-900">{formatMmk(product.retailPriceMmk)}</p>
          {wholesale && (
            <p className="text-xs text-neutral-700">
              {t('wholesaleFrom')}: {formatMmk(wholesale.unitPriceMmk)} {t('perPiece')}
            </p>
          )}
          <p className="text-xs text-neutral-600">
            {t('minOrder')}: {product.moq} {t('pieces')}
          </p>
        </div>
      </div>
    </Link>
  );
}
