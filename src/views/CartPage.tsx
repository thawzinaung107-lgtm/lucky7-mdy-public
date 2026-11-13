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
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-20 text-center">
        <ShoppingBag size={40} className="text-neutral-300" aria-hidden="true" />
        <h1 className="text-xl font-bold text-neutral-900">{t('cartTitle')}</h1>
        <p className="text-sm text-neutral-600">{t('cartEmpty')}</p>
        <p className="text-sm text-neutral-500">{t('cartEmptyHint')}</p>
        <Link
          to="/shop"
          className="mt-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 active:scale-95"
        >
          {t('continueShopping')}
        </Link>
      </div>
    );
  }

  const quoteBySlug = new Map((quote.quotes ?? []).map((line) => [line.slug, line]));
  const fallbackTotal = items.reduce((sum, item) => sum + item.qty * item.unitPriceMmk, 0);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900">{t('cartTitle')}</h1>

      <ul className="flex flex-col gap-4">
        {groups.map((group) => {
          const head = group[0];
          const name = language === 'my' ? head.nameMy : head.nameEn;
          const line = quoteBySlug.get(head.productSlug);
          return (
            <li key={head.productId} className="flex flex-col gap-3 rounded-3xl border border-neutral-200 bg-white p-4">
              <div className="flex items-center gap-4">
                <Link
                  to={`/product/${head.productSlug}`}
                  className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100"
                >
                  {head.imageUrl && (
                    <img src={head.imageUrl} alt={name} className="h-full w-full object-cover" />
                  )}
                </Link>
                <div className="flex flex-col gap-1">
                  <Link
                    to={`/product/${head.productSlug}`}
                    className="text-sm font-semibold text-neutral-900 hover:underline"
                  >
                    {name}
                  </Link>
                  {line && (
                    <p className="text-xs text-neutral-600">
                      {formatMmk(line.unitPriceMmk)} {t('perPiece')}
                    </p>
                  )}
                </div>
              </div>

              <ul className="flex flex-col divide-y divide-neutral-100">
                {group.map((item) => {
                  const colorLabel =
                    language === 'my' && item.colorMy ? item.colorMy : item.colorEn;
                  return (
                    <li key={item.variantId} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-neutral-900">
                          {t('color')}: {colorLabel} · {t('size')}: {item.sizeLabel}
                        </span>
                        <span className="text-xs text-neutral-600">
                          {formatMmk(item.unitPriceMmk)} × {item.qty}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="-"
                          onClick={() => (item.qty <= 1 ? removeItem(item.variantId) : setQty(item.variantId, item.qty - 1))}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-neutral-900 transition hover:border-neutral-900 active:scale-90"
                        >
                          <Minus size={16} aria-hidden="true" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold tabular-nums text-neutral-900">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          aria-label="+"
                          disabled={item.qty >= item.stockQty}
                          onClick={() => setQty(item.variantId, item.qty + 1)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-neutral-900 transition hover:border-neutral-900 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Plus size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={t('remove')}
                          onClick={() => removeItem(item.variantId)}
                          className="ml-1 flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-red-50 hover:text-red-700 active:scale-90"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {line && line.issues.length > 0 && (
                <div className="flex flex-col gap-1 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                  {line.issues.includes('below_moq') && <span>{t('belowMoq', { n: line.moq })}</span>}
                  {line.issues.includes('off_step') && <span>{t('offStep', { n: line.orderStep })}</span>}
                  {line.unavailableSkus.length > 0 && <span>{t('unavailableWarning')}</span>}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-3 rounded-3xl bg-neutral-900 p-6 text-white">
        <div className="flex items-center justify-between text-sm text-neutral-300">
          <span>
            {t('quantity')}: <span className="font-semibold tabular-nums text-white">{totalQty}</span> {t('pieces')}
          </span>
          {quote.loading && <span>{t('quoteLoading')}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-neutral-300">{quote.error ? t('estimate') : t('serverQuote')}</p>
          <p className="text-3xl font-bold tabular-nums">{formatMmk(quote.totalMmk ?? fallbackTotal)}</p>
          {quote.error && <p className="text-xs text-amber-300">{t('quoteError')}</p>}
        </div>
        <button
          type="button"
          disabled
          className="w-fit cursor-not-allowed rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white/60"
        >
          {t('checkout')}
        </button>
        <p className="text-xs text-neutral-400">{t('checkoutSoon')}</p>
      </div>
    </div>
  );
}
