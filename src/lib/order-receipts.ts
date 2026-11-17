const KEY = 'lucky7-order-receipts';
export interface SavedReceipt { id: string; receipt: string; number: string }
export function readReceipts(): SavedReceipt[] {
  try { const values: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(values) ? values.filter((v): v is SavedReceipt => typeof v?.id === 'string' && typeof v?.receipt === 'string' && typeof v?.number === 'string') : []; } catch { return []; }
}
export function saveReceipt(value: SavedReceipt) { localStorage.setItem(KEY, JSON.stringify([value, ...readReceipts().filter((r) => r.id !== value.id)].slice(0, 100))); }
export function getReceipt(id: string) { return readReceipts().find((r) => r.id === id)?.receipt; }

const ATTEMPT_KEY = 'lucky7-pending-attempt';
export function clearOrderAttempt() { localStorage.removeItem(ATTEMPT_KEY); }
export function orderAttempt(signature: string): { requestKey: string; receipt: string } {
  try {
    const previous = JSON.parse(localStorage.getItem(ATTEMPT_KEY) ?? 'null');
    if (previous?.signature === signature && /^[a-f0-9]{64}$/.test(previous.receipt) && /^[a-f0-9-]{36}$/.test(previous.requestKey)) return { requestKey: previous.requestKey, receipt: previous.receipt };
  } catch { /* Create a fresh attempt when storage cannot be read. */ }
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const attempt = { requestKey: crypto.randomUUID(), receipt: Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('') };
  localStorage.setItem(ATTEMPT_KEY, JSON.stringify({ ...attempt, signature }));
  return attempt;
}