import type { ProductSummary } from '@/types/catalog';
import type { CartItem } from '@/lib/cart';
import type { Language } from '@/lib/messages';
import { formatMmk } from '@/lib/pricing';

export function matchesSearch(product: ProductSummary, query: string): boolean {
  const words = query.normalize('NFC').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const text = [product.nameMy, product.nameEn, product.summaryMy, product.summaryEn].join(' ').normalize('NFC').toLocaleLowerCase();
  return words.every((word) => text.includes(word));
}

export function quantityProgress(quantity: number, target: number): number {
  return Math.min(100, Math.max(0, quantity / Math.max(1, target) * 100));
}

export function buildOrderMessage(items: CartItem[], total: number, language: Language, notes: string): string {
  const lines = items.map((item) => `${language === 'my' ? item.nameMy : item.nameEn}\n${language === 'my' ? item.colorMy || item.colorEn : item.colorEn} · ${item.sizeLabel} × ${item.qty}`);
  return ['Lucky 7 Fashion Mandalay', language === 'my' ? 'အော်ဒါတောင်းဆိုမှု' : 'Order request', ...lines, `${language === 'my' ? 'စုစုပေါင်း' : 'Total'}: ${formatMmk(total)}`, notes.trim(), language === 'my' ? 'လက်ကျန်၊ ပို့ခနှင့် နောက်ဆုံးစျေးနှုန်းကို အတည်ပြုပေးပါ။' : 'Please confirm stock, delivery cost, and final pricing.'].filter(Boolean).join('\n\n');
}

export function telegramOrderUrl(message: string, storeUrl: string): string {
  if (/^https:\/\/t\.me\/[a-zA-Z0-9_]+\/?$/.test(storeUrl)) {
    return `${storeUrl.replace(/\/$/, '')}?text=${encodeURIComponent(message)}`;
  }
  return `https://t.me/share/url?url=&text=${encodeURIComponent(message)}`;
}