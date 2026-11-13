import { useMemo, useState } from 'react';
import { Link } from '@/lib/router';
import { Minus, Plus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useCart } from '@/lib/cart';
import { checkQuantity, formatMmk, getWholesaleOffer } from '@/lib/pricing';
import type { ProductDetail, Variant } from '@/types/catalog';
import { Button } from '@/components/ui/button';
import { quantityProgress } from '@/lib/shopping';

interface ColorGroup {
  key: string;
  label: string;
  variants: Variant[];
}

export default function OrderPicker({ product, compact = false }: { product: ProductDetail; compact?: boolean }) {
  const { t, language } = useI18n();
  const { addItem } = useCart();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [added, setAdded] = useState(false);
  const [selectedColor, setSelectedColor] = useState(product.variants[0]?.colorEn ?? '');

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
  const tiers = [...product.priceTiers].sort((a, b) => a.minQty - b.minQty);
  const firstWholesale = tiers.find((tier) => tier.customerGroup === 'wholesale');
  const addSelection = () => {
    if (!canAdd) return;
    addItem(product, quantities);
    setAdded(true);
  };

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
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('color')}>
        {colorGroups.map((group) => {
          const count = group.variants.reduce((sum, variant) => sum + (quantities[variant.id] ?? 0), 0);
          return <Button key={group.key} variant={selectedColor === group.key ? 'default' : 'outline'} aria-pressed={selectedColor === group.key} onClick={() => setSelectedColor(group.key)} className="h-auto whitespace-normal rounded-lg py-2">{group.label}{count > 0 && <span className="tabular-nums">({count})</span>}</Button>;
        })}
      </div>
      {colorGroups.filter((group) => group.key === selectedColor).map((group) => (
        <div key={group.key} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            {t('color')}: {group.label}
          </h3>
          <ul className="glass-pill flex flex-col divide-y divide-input overflow-hidden rounded-2xl">
            {group.variants.map((variant) => {
              const quantity = quantities[variant.id] ?? 0;
              const soldOut = variant.stockQty === 0;
              return (
                <li key={variant.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-3 sm:flex sm:justify-between sm:gap-3 sm:px-4">
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {t('size')}: {variant.sizeLabel}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {soldOut ? t('soldOut') : `${t('inStock')}: ${variant.stockQty}`}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                    <Button variant="outline" size="icon"
                      type="button"
                      aria-label="-"
                      title={`${t('quantity')} − · ${group.label} ${variant.sizeLabel}`}
                      disabled={soldOut || quantity === 0}
                      onClick={() => setQuantity(variant, quantity - 1)}
                      className="glass-pill flex h-9 w-9 items-center justify-center rounded-full text-foreground transition hover:bg-secondary active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus size={16} aria-hidden="true" />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums text-foreground">
                      {quantity}
                    </span>
                    <Button variant="outline" size="icon"
                      type="button"
                      aria-label="+"
                      title={`${t('quantity')} + · ${group.label} ${variant.sizeLabel}`}
                      disabled={soldOut || quantity >= variant.stockQty}
                      onClick={() => setQuantity(variant, quantity + 1)}
                      className="glass-pill flex h-9 w-9 items-center justify-center rounded-full text-foreground transition hover:bg-secondary active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus size={16} aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold text-foreground">{totalQty < product.moq ? t('minimumProgress', { n: product.moq - totalQty }) : t('minimumReached')}</p>
        <progress value={quantityProgress(totalQty, product.moq)} max={100} aria-label={t('minOrder')} className="quantity-progress h-2 w-full overflow-hidden rounded-full" />
        {firstWholesale && totalQty < firstWholesale.minQty && <p className="text-xs text-muted-foreground">{t('wholesaleProgress', { n: firstWholesale.minQty - totalQty })}</p>}
        {tiers.length > 0 && <div className="overflow-x-auto"><table className="w-full text-left text-xs"><caption className="pb-2 text-left text-sm font-semibold">{t('priceTiers')}</caption><thead><tr className="border-b border-input"><th className="py-2 pr-3">{t('quantity')}</th><th className="py-2 pr-3">{t('perPiece')}</th><th className="py-2">{t('retailPrice')} / {t('wholesale')}</th></tr></thead><tbody>{tiers.map((tier, index) => <tr key={`${tier.customerGroup}-${tier.minQty}-${index}`} className="border-b border-input"><td className="py-2 pr-3 tabular-nums">{tier.minQty}+</td><td className="py-2 pr-3 tabular-nums">{formatMmk(tier.unitPriceMmk)}</td><td className="py-2">{tier.customerGroup === 'wholesale' ? t('wholesale') : t('retailPrice')}</td></tr>)}</tbody></table><p className="mt-2 text-xs text-muted-foreground">{t('wholesaleNote')}</p></div>}
      </div>

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
        <Button
          type="button"
          disabled={!canAdd}
          onClick={addSelection}
          className="h-auto w-full whitespace-normal rounded-full bg-primary-foreground px-6 py-3 text-sm font-bold text-primary shadow-lg transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {added ? t('addedToCart') : t('addToCart')}
        </Button>
        {added && (
          <Link
            to="/cart"
            className="w-fit text-sm font-semibold text-primary-foreground underline underline-offset-4 hover:text-primary-foreground/85"
          >
            {t('viewCart')}
          </Link>
        )}
      </div>
      {!compact && <div className="glass-panel fixed inset-x-0 bottom-[5.5rem] z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 lg:hidden"><div className="min-w-0 text-xs"><p className="font-bold tabular-nums">{formatMmk(estimate)}</p><p>{totalQty} {t('pieces')}</p></div><Button disabled={!canAdd} onClick={addSelection} className="h-auto max-w-56 whitespace-normal py-2">{added ? t('addedToCart') : t('addToCart')}</Button></div>}
    </div>
  );
}
