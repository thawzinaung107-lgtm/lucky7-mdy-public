import { useMemo, useState } from 'react';
import { Link } from '@/lib/router';
import { Minus, Plus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useCart } from '@/lib/cart';
import { checkQuantity, formatMmk, getWholesaleOffer } from '@/lib/pricing';
import type { ProductDetail, Variant } from '@/types/catalog';

interface ColorGroup {
  key: string;
  label: string;
  variants: Variant[];
}

export default function OrderPicker({ product }: { product: ProductDetail }) {
  const { t, language } = useI18n();
  const { addItem } = useCart();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [added, setAdded] = useState(false);

  const colorGroups = useMemo<ColorGroup[]>(() => {
    const groups = new Map<string, ColorGroup>();
    for (const variant of product.variants) {
      const existing = groups.get(variant.colorEn);
      const label = language === 'my' && variant.colorMy ? variant.colorMy : variant.colorEn;
      if (existing) {
        existing.variants.push(variant);
      } else {
        groups.set(variant.colorEn, { key: variant.colorEn, label, variants: [variant] });
      }
    }
    return Array.from(groups.values());
  }, [product.variants, language]);

  const wholesale = getWholesaleOffer(product.priceTiers);
  const totalQty = product.variants.reduce((sum, variant) => sum + (quantities[variant.id] ?? 0), 0);
  const issue = totalQty > 0 ? checkQuantity(totalQty, product.moq, product.orderStep) : null;
  const estimate = totalQty * product.retailPriceMmk;
  const reachedWholesale = wholesale !== null && totalQty >= wholesale.minQty;
  const canAdd = totalQty > 0 && issue === null;

  const setQuantity = (variant: Variant, next: number) => {
    const clamped = Math.min(Math.max(next, 0), variant.stockQty);
    setAdded(false);
    setQuantities((prev) => ({ ...prev, [variant.id]: clamped }));
  };

  if (product.variants.length === 0) {
    return (
      <p className="glass-pill rounded-2xl border-dashed p-6 text-sm text-muted-foreground">
        {t('noVariants')}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {colorGroups.map((group) => (
        <div key={group.key} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            {t('color')}: {group.label}
          </h3>
          <ul className="glass-pill flex flex-col divide-y divide-input overflow-hidden rounded-2xl">
            {group.variants.map((variant) => {
              const quantity = quantities[variant.id] ?? 0;
              const soldOut = variant.stockQty === 0;
              return (
                <li key={variant.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {t('size')}: {variant.sizeLabel}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {soldOut ? t('soldOut') : `${t('inStock')}: ${variant.stockQty}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="-"
                      disabled={soldOut || quantity === 0}
                      onClick={() => setQuantity(variant, quantity - 1)}
                      className="glass-pill flex h-9 w-9 items-center justify-center rounded-full text-foreground transition hover:bg-secondary active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus size={16} aria-hidden="true" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums text-foreground">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="+"
                      disabled={soldOut || quantity >= variant.stockQty}
                      onClick={() => setQuantity(variant, quantity + 1)}
                      className="glass-pill flex h-9 w-9 items-center justify-center rounded-full text-foreground transition hover:bg-secondary active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus size={16} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="glass-dark flex flex-col gap-3 rounded-3xl p-5">
        <div className="flex items-center justify-between text-sm text-primary-foreground/70">
          <span>
            {t('quantity')}: <span className="font-semibold text-primary-foreground tabular-nums">{totalQty}</span> {t('pieces')}
          </span>
        </div>
        {totalQty === 0 ? (
          <p className="text-sm text-primary-foreground/70">{t('chooseQuantity')}</p>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="text-sm text-primary-foreground/70">{t('estimate')}</p>
            <p className="text-2xl font-bold tabular-nums">{formatMmk(estimate)}</p>
            <p className="text-xs text-primary-foreground/55">{t('estimateNote')}</p>
          </div>
        )}
        {issue === 'below_moq' && <p className="text-sm font-semibold text-brand-gold">{t('belowMoq', { n: product.moq })}</p>}
        {issue === 'off_step' && (
          <p className="text-sm font-semibold text-brand-gold">{t('offStep', { n: product.orderStep })}</p>
        )}
        {reachedWholesale && <p className="text-sm text-primary-foreground/85">{t('wholesaleHint')}</p>}
        <button
          type="button"
          disabled={!canAdd}
          onClick={() => {
            addItem(product, quantities);
            setAdded(true);
          }}
          className="w-fit rounded-full bg-primary-foreground px-6 py-3 text-sm font-bold text-primary shadow-lg transition hover:-translate-y-0.5 hover:bg-accent active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {added ? t('addedToCart') : t('addToCart')}
        </button>
        {added && (
          <Link
            to="/cart"
            className="w-fit text-sm font-semibold text-primary-foreground underline underline-offset-4 hover:text-primary-foreground/85"
          >
            {t('viewCart')}
          </Link>
        )}
        <p className="text-xs text-primary-foreground/55">{t('checkoutSoon')}</p>
      </div>
    </div>
  );
}
