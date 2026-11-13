import { loadCart, saveCart } from '@/lib/store.functions';

const TOKEN_KEY = 'storefront-cart-token';
const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ServerCartItem {
  variantId: string;
  qty: number;
  payload: Record<string, string | number | null>;
}

function readToken(): string | null {
  const value = window.localStorage.getItem(TOKEN_KEY);
  return value && TOKEN_PATTERN.test(value) ? value : null;
}

function createToken(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function ensureToken(): string {
  const existing = readToken();
  if (existing) return existing;
  const fresh = createToken();
  window.localStorage.setItem(TOKEN_KEY, fresh);
  return fresh;
}

export async function loadServerCart(): Promise<ServerCartItem[]> {
  const token = ensureToken();
  const body = await loadCart({ data: { token } });
  return body.items.filter(
    (e) => typeof e.payload === 'object' && e.payload !== null && Number.isSafeInteger(e.qty) && e.qty >= 1,
  );
}

export async function saveServerCart(items: ServerCartItem[]): Promise<void> {
  const token = ensureToken();
  await saveCart({ data: { token, items } });
}
