import { ArrowUpRight, Eye } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import QuickView from '@/components/QuickView';
import { Link } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { formatMmk, getWholesaleOffer } from '@/lib/pricing';
import type { ProductSummary } from '@/types/catalog';

export default function ProductCard({ product }: { product: ProductSummary }) {
  const { t, language } = useI18n();
  const name = language === 'my' ? product.nameMy : product.nameEn;
  const wholesale = getWholesaleOffer(product.priceTiers);
  const [open, setOpen] = useState(false);

  return (
    <article className="glass-card group flex min-w-0 flex-col overflow-hidden rounded-[1.75rem] text-left hover:-translate-y-1.5">
      <Link to={`/product/${product.slug}`} className="relative m-2 block aspect-[3/4] overflow-hidden rounded-[1.3rem] bg-muted">
        <img
          src={product.primaryImageUrl}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {product.stockQty !== undefined && <span className={`absolute left-2 top-2 rounded-md px-2 py-1 text-xs font-semibold ${product.stockQty > 0 ? 'bg-background/90 text-foreground' : 'bg-primary text-primary-foreground'}`}>{product.stockQty > 0 ? t('inStock') : t('soldOut')}</span>}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-3 px-3 pb-4 pt-2 sm:px-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
          <h3 className="min-w-0 text-sm font-semibold text-foreground"><Link to={`/product/${product.slug}`}>{name}</Link></h3>
          <Link to={`/product/${product.slug}`} aria-label={t('productDetails')} className="glass-pill flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
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
        <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="outline" className="glass-pill h-auto min-h-9 w-full whitespace-normal py-2"><Eye />{t('quickView')}</Button></DialogTrigger>{open && <QuickView slug={product.slug} />}</Dialog>
      </div>
    </article>
  );
}
