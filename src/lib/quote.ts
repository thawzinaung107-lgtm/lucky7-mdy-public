import { quoteCart } from '@/lib/store.functions';

export interface QuoteLine {
  productId: string;
  slug: string;
  nameEn: string;
  totalQty: number;
  unitPriceMmk: number;
  subtotalMmk: number;
  moq: number;
  orderStep: number;
  issues: string[];
  wholesaleApplied: boolean;
  wholesaleFrom: { unitPriceMmk: number; minQty: number } | null;
  unavailableSkus: string[];
}

export interface CartQuote {
  totalMmk: number;
  quotes: QuoteLine[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

export async function fetchCartQuote(
  items: { variantId: string; qty: number }[],
): Promise<CartQuote> {
  const data: unknown = await quoteCart({ data: { items } }).catch(() => null);
  if (!isRecord(data) || !Array.isArray(data.quotes)) {
    throw new Error('quote_request_failed');
  }
  const quotes = data.quotes.filter(isRecord).map<QuoteLine>((line) => ({
    productId: typeof line.productId === 'string' ? line.productId : '',
    slug: typeof line.slug === 'string' ? line.slug : '',
    nameEn: typeof line.nameEn === 'string' ? line.nameEn : '',
    totalQty: asNumber(line.totalQty),
    unitPriceMmk: asNumber(line.unitPriceMmk),
    subtotalMmk: asNumber(line.subtotalMmk),
    moq: asNumber(line.moq),
    orderStep: asNumber(line.orderStep),
    issues: asStringArray(line.issues),
    wholesaleApplied: line.wholesaleApplied === true,
    wholesaleFrom:
      isRecord(line.wholesaleFrom) && typeof line.wholesaleFrom.unitPriceMmk === 'number'
        ? {
            unitPriceMmk: line.wholesaleFrom.unitPriceMmk,
            minQty: asNumber(line.wholesaleFrom.minQty),
          }
        : null,
    unavailableSkus: asStringArray(line.unavailableSkus),
  }));
  return { totalMmk: asNumber(data.totalMmk), quotes };
}
