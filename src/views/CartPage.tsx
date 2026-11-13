import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/lib/router';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useCart, type CartItem } from '@/lib/cart';
import { fetchCartQuote, type QuoteLine } from '@/lib/quote';
import { formatMmk } from '@/lib/pricing';

interface QuoteState {
  loading: boolean;
  error: boolean;
  quotes: QuoteLine[] | null;
  totalMmk: number | null;
}

const IDLE_QUOTE: QuoteState = { loading: false, error: false, quotes: null, totalMmk: null };

export default function CartPage() {
  const { t, language } = useI18n();
  const { items, totalQty, setQty, removeItem } = useCart();
  const [quote, setQuote] = useState<QuoteState>(IDLE_QUOTE);

  const signature = useMemo(
    () => items.map((item) => `${item.variantId}:${item.qty}`).join('|'),
    [items],
  );

  useEffect(() => {
    if (items.length === 0) {
      setQuote(IDLE_QUOTE);
      return;
    }
    let active = true;
    setQuote((prev) => ({ ...prev, loading: true }));
    const timer = window.setTimeout(() => {
      fetchCartQuote(items.map((item) => ({ variantId: item.variantId, qty: item.qty })))
        .then((result) => {
          if (active) setQuote({ loading: false, error: false, quotes: result.quotes, totalMmk: result.totalMmk });
        })
        .catch(() => {
          if (active) setQuote({ loading: false, error: true, quotes: null, totalMmk: null });
        });
    }, 400);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const groups = useMemo(() => {
    const map = new Map<string, CartItem[]>();
    for (const item of items) {
      const existing = map.get(item.productId);
      if (existing) existing.push(item);
      else map.set(item.productId, [item]);
    }
    return Array.from(map.values());
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-6xl px-4 py-16">
        <div className="glass-panel mx-auto flex w-full max-w-lg flex-col items-center gap-3 rounded-[2rem] p-10 text-center">
          <span className="glass-pill flex h-20 w-20 items-center justify-center rounded-full text-brand-gold">
            <ShoppingBag size={36} aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold text-foreground">{t('cartTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('cartEmpty')}</p>
          <p className="text-sm text-muted-foreground/80">{t('cartEmptyHint')}</p>
          <Link
            to="/shop"
            className="mt-3 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition hover:-translate-y-0.5 active:scale-95"
          >
            {t('continueShopping')}
          </Link>
        </div>
      </div>
    );
  }

  const quoteBySlug = new Map((quote.quotes ?? []).map((line) => [line.slug, line]));
  const fallbackTotal = items.reduce((sum, item) => sum + item.qty * item.unitPriceMmk, 0);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-3">
        <span className="gold-rule h-1 w-12 rounded-full" aria-hidden="true" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('cartTitle')}</h1>
      </header>

      <ul className="flex flex-col gap-4">
        {groups.map((group) => {
          const head = group[0];
          const name = language === 'my' ? head.nameMy : head.nameEn;
          const line = quoteBySlug.get(head.productSlug);
          return (
            <li key={head.productId} className="glass-card flex flex-col gap-3 rounded-[1.75rem] p-4 sm:p-5">
              <div className="flex items-center gap-4">
                <Link
                  to={`/product/${head.productSlug}`}
                  className="glass-pill h-24 w-20 shrink-0 overflow-hidden rounded-2xl p-1"
                >
                  {head.imageUrl && (
                    <img src={head.imageUrl} alt={name} className="h-full w-full rounded-xl object-cover" />
                  )}
                </Link>
                <div className="flex min-w-0 flex-col gap-1">
                  <Link
                    to={`/product/${head.productSlug}`}
                    className="text-sm font-semibold text-foreground hover:underline"
                  >
                    {name}
                  </Link>
                  {line && (
                    <p className="text-xs text-muted-foreground">
                      {formatMmk(line.unitPriceMmk)} {t('perPiece')}
                    </p>
                  )}
                </div>
              </div>

              <ul className="flex flex-col divide-y divide-input">
                {group.map((item) => {
                  const colorLabel =
                    language === 'my' && item.colorMy ? item.colorMy : item.colorEn;
                  return (
                    <li key={item.variantId} className="grid grid-cols-1 items-center gap-3 py-3 min-[480px]:grid-cols-[minmax(0,1fr)_auto] sm:flex sm:justify-between">
                      <div className="flex min-w-0 flex-col">
                        <span className="text-sm font-semibold text-foreground">
                          {t('color')}: {colorLabel} · {t('size')}: {item.sizeLabel}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatMmk(item.unitPriceMmk)} × {item.qty}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center justify-end gap-2">
                        <button
                          type="button"
                          aria-label="-"
                          onClick={() => (item.qty <= 1 ? removeItem(item.variantId) : setQty(item.variantId, item.qty - 1))}
                          className="glass-pill flex h-9 w-9 items-center justify-center rounded-full text-foreground transition hover:bg-secondary active:scale-90"
                        >
                          <Minus size={16} aria-hidden="true" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold tabular-nums text-foreground">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          aria-label="+"
                          disabled={item.qty >= item.stockQty}
                          onClick={() => setQty(item.variantId, item.qty + 1)}
                          className="glass-pill flex h-9 w-9 items-center justify-center rounded-full text-foreground transition hover:bg-secondary active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Plus size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={t('remove')}
                          onClick={() => removeItem(item.variantId)}
                          className="ml-1 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive active:scale-90"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {line && line.issues.length > 0 && (
                <div className="flex flex-col gap-1 rounded-2xl bg-accent/70 p-3 text-xs font-semibold text-accent-foreground">
                  {line.issues.includes('below_moq') && <span>{t('belowMoq', { n: line.moq })}</span>}
                  {line.issues.includes('off_step') && <span>{t('offStep', { n: line.orderStep })}</span>}
                  {line.unavailableSkus.length > 0 && <span>{t('unavailableWarning')}</span>}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="glass-dark flex flex-col gap-3 rounded-[1.75rem] p-6">
        <div className="grid grid-cols-1 gap-2 text-sm text-primary-foreground/70 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <span>
            {t('quantity')}: <span className="font-semibold tabular-nums text-primary-foreground">{totalQty}</span> {t('pieces')}
          </span>
          {quote.loading && <span>{t('quoteLoading')}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-primary-foreground/70">{quote.error ? t('estimate') : t('serverQuote')}</p>
          <p className="text-3xl font-bold tabular-nums">{formatMmk(quote.totalMmk ?? fallbackTotal)}</p>
          {quote.error && <p className="text-xs text-brand-gold">{t('quoteError')}</p>}
        </div>
        <button
          type="button"
          disabled
          className="w-fit cursor-not-allowed rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-6 py-3 text-sm font-semibold text-primary-foreground/60"
        >
          {t('checkout')}
        </button>
        <p className="text-xs text-primary-foreground/55">{t('checkoutSoon')}</p>
      </div>
    </div>
  );
}
