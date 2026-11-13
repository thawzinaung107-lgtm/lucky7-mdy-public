import { ArrowUpRight } from 'lucide-react';
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
      className="glass-card group flex flex-col overflow-hidden rounded-[1.75rem] hover:-translate-y-1.5"
    >
      <div className="m-2 aspect-[3/4] overflow-hidden rounded-[1.3rem] bg-muted">
        <img
          src={product.primaryImageUrl}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{name}</h3>
          <span className="glass-pill flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
            <ArrowUpRight size={15} aria-hidden="true" />
          </span>
        </div>
        <div className="mt-auto flex flex-col gap-1.5">
          <p className="text-base font-bold text-foreground">{formatMmk(product.retailPriceMmk)}</p>
          {wholesale && (
            <p className="w-fit rounded-full bg-secondary/80 px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
              {t('wholesaleFrom')}: {formatMmk(wholesale.unitPriceMmk)} {t('perPiece')}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {t('minOrder')}: {product.moq} {t('pieces')}
          </p>
        </div>
      </div>
    </Link>
  );
}
