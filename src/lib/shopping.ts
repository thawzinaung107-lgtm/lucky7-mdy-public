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

export interface BuyerInfo { name: string; phone: string; address: string; payment: 'kpay' | 'wave' | 'cod' }
export const PAYMENT_LABELS: Record<BuyerInfo['payment'], { my: string; en: string }> = {
  kpay: { my: 'KBZPay', en: 'KBZPay' }, wave: { my: 'WavePay', en: 'WavePay' }, cod: { my: 'အိမ်ရောက်ငွေချေ (COD)', en: 'Cash on delivery (COD)' },
};
export function isBuyerInfoComplete(b: BuyerInfo): boolean {
  return b.name.trim().length >= 2 && /^(\+?95|0)9\d{7,9}$/.test(b.phone.replace(/[\s-]/g, '')) && b.address.trim().length >= 5;
}
export const ORDER_MARKER = '#L7ORDER';
export function buildOrderMessage(items: CartItem[], total: number, language: Language, notes: string, buyer?: BuyerInfo): string {
  const my = language === 'my';
  const buyerBlock = buyer ? [
    `${my ? 'အမည်' : 'Name'}: ${buyer.name.trim()}`,
    `${my ? 'ဖုန်း' : 'Phone'}: ${buyer.phone.trim()}`,
    `${my ? 'လိပ်စာ' : 'Address'}: ${buyer.address.trim()}`,
    `${my ? 'ငွေပေးချေမှု' : 'Payment'}: ${PAYMENT_LABELS[buyer.payment][language]}`,
  ].join('\n') : '';
  const lines = items.map((item) => `${language === 'my' ? item.nameMy : item.nameEn}\n${language === 'my' ? item.colorMy || item.colorEn : item.colorEn} · ${item.sizeLabel} × ${item.qty}`);
  return ['Lucky 7 Fashion Mandalay', language === 'my' ? 'အော်ဒါတောင်းဆိုမှု' : 'Order request', ...lines, `${language === 'my' ? 'စုစုပေါင်း' : 'Total'}: ${formatMmk(total)}`, buyerBlock, notes.trim(), language === 'my' ? 'လက်ကျန်၊ ပို့ခနှင့် နောက်ဆုံးစျေးနှုန်းကို အတည်ပြုပေးပါ။' : 'Please confirm stock, delivery cost, and final pricing.', ORDER_MARKER].filter(Boolean).join('\n\n');
}

export function telegramOrderUrl(message: string, storeUrl: string): string {
  if (/^https:\/\/t\.me\/[a-zA-Z0-9_]+\/?$/.test(storeUrl)) {
    return `${storeUrl.replace(/\/$/, '')}?text=${encodeURIComponent(message)}`;
  }
  return `https://t.me/share/url?url=&text=${encodeURIComponent(message)}`;
}