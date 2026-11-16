import { describe, expect, it } from 'vitest';
import { buildOrderMessage, isBuyerInfoComplete, matchesSearch, quantityProgress, telegramOrderUrl } from '@/lib/shopping';
import { checkQuantity } from '@/lib/pricing';
import type { ProductSummary } from '@/types/catalog';
import type { CartItem } from '@/lib/cart';

const product = { nameMy: 'အင်္ကျီ', nameEn: 'Rose Blouse', summaryMy: '', summaryEn: 'Cotton top' } as ProductSummary;
const item = { nameMy: 'အင်္ကျီ', nameEn: 'Rose Blouse', colorMy: 'ပန်းရောင်', colorEn: 'Pink', sizeLabel: 'M', qty: 2 } as CartItem;
describe('Shopping improvements', () => {
  it('searches Myanmar names', () => expect(matchesSearch(product, 'အင်္ကျီ')).toBe(true));
  it('searches English without case sensitivity and rejects unrelated results', () => { expect(matchesSearch(product, 'ROSE cotton')).toBe(true); expect(matchesSearch(product, 'skirt')).toBe(false); });
  it('shows concrete minimum-order progress without overflow', () => { expect(quantityProgress(2, 6)).toBeCloseTo(33.333); expect(quantityProgress(8, 6)).toBe(100); });
  it('preserves minimum and order-step restrictions', () => { expect(checkQuantity(1, 2, 2)).toBe('below_moq'); expect(checkQuantity(3, 2, 2)).toBe('off_step'); expect(checkQuantity(2, 2, 2)).toBeNull(); });
  it('prepares chosen variants and the quoted MMK total', () => { const text = buildOrderMessage([item], 49000, 'en', 'Mandalay'); expect(text).toContain('Pink · M × 2'); expect(text).toContain('MMK 49,000'); expect(text).toContain('Mandalay'); expect(text).toContain('Please confirm stock'); });
  it('includes buyer name, phone, address and payment in the order', () => { const text = buildOrderMessage([item], 49000, 'en', '', { name: 'Su Su', phone: '09123456789', address: 'Chanayethazan, Mandalay', payment: 'cod' }); expect(text).toContain('Phone: 09123456789'); expect(text).toContain('Address: Chanayethazan, Mandalay'); expect(text).toContain('Cash on delivery'); expect(text).toContain('#L7ORDER'); });
  it('requires a valid Myanmar phone and address before ordering', () => { expect(isBuyerInfoComplete({ name: 'Su', phone: '09123456789', address: 'Mandalay', payment: 'kpay' })).toBe(true); expect(isBuyerInfoComplete({ name: 'Su', phone: '12345', address: 'Mandalay', payment: 'kpay' })).toBe(false); expect(isBuyerInfoComplete({ name: 'Su', phone: '09123456789', address: '', payment: 'kpay' })).toBe(false); });
  it('uses Telegram recipient selection when shop contact is missing', () => { const url = new URL(telegramOrderUrl('Order & 2 pieces', '')); expect(url.pathname).toBe('/share/url'); expect(url.searchParams.get('text')).toBe('Order & 2 pieces'); });
  it('opens configured shop contact with an encoded draft', () => { expect(telegramOrderUrl('2 pieces', 'https://t.me/shop_name')).toBe('https://t.me/shop_name?text=2%20pieces'); });
});