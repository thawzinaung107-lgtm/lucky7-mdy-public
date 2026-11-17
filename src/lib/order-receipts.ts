const KEY = 'lucky7-order-receipts';
export interface SavedReceipt { id: string; receipt: string; number: string }
export function readReceipts(): SavedReceipt[] {
  try { const values: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(values) ? values.filter((v): v is SavedReceipt => typeof v?.id === 'string' && typeof v?.receipt === 'string' && typeof v?.number === 'string') : []; } catch { return []; }
}
export function saveReceipt(value: SavedReceipt) { localStorage.setItem(KEY, JSON.stringify([value, ...readReceipts().filter((r) => r.id !== value.id)].slice(0, 100))); }
export function getReceipt(id: string) { return readReceipts().find((r) => r.id === id)?.receipt; }