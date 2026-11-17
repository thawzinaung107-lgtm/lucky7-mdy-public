import { useCallback, useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useParams, Link } from '@/lib/router';
import { buyerOrder, sendPaymentProof } from '@/lib/orders.functions';
import { getReceipt } from '@/lib/order-receipts';
import type { Order } from '@/lib/order-rules';
import { useI18n } from '@/lib/i18n';
import OrderSummary from '@/components/OrderSummary';
import OrderContact from '@/components/OrderContact';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function OrderPage() {
  const { id } = useParams(); const { language } = useI18n(); const my = language === 'my';
  const read = useServerFn(buyerOrder); const proof = useServerFn(sendPaymentProof);
  const [order, setOrder] = useState<Order | null>(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { if (!id) return; setBusy(true); try { setOrder((await read({ data: { id, receipt: getReceipt(id) } })).order); setError(''); } catch { setError(my ? 'အော်ဒါ မတွေ့ပါ။ မူလဖုန်းဖြင့်ဖွင့်ပါ သို့မဟုတ် Google ဝင်ပါ။' : 'Order unavailable. Open on the original device or sign in with Google.'); } finally { setBusy(false); } }, [id, read, my]);
  useEffect(() => { void load(); }, [load]);
  return <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-10"><div className="flex items-center justify-between gap-3"><Link to="/orders" className="text-sm underline">{my ? 'အော်ဒါများ' : 'Orders'}</Link><Button size="icon" variant="outline" disabled={busy} aria-label="Refresh order" title="Refresh order" onClick={() => { void load(); }}><RefreshCw /></Button></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{busy && !order && <p>{my ? 'ဖွင့်နေသည်…' : 'Loading…'}</p>}{order && <><OrderSummary order={order} /><OrderContact order={order} />{order.payment_method !== 'cod' && ['unpaid', 'verification_pending'].includes(order.payment_status) && !['cancelled', 'completed'].includes(order.status) && <section className="flex flex-col gap-3 border-t border-border pt-5"><h2 className="font-semibold">{my ? 'ငွေလွှဲအထောက်အထား' : 'Payment evidence'}</h2><p className="text-sm text-muted-foreground">{my ? 'ဆိုင်နှင့် ငွေပမာဏအတည်ပြုပြီးမှ လွှဲပါ။ ဆိုင်မှ ငွေဝင်ကြောင်း စစ်ဆေးပေးပါမည်။' : 'Transfer only after agreeing the amount with the shop. The shop will verify receipt of payment.'}</p><input aria-label="Payment proof" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} className="glass-input w-full rounded-lg p-3 text-sm" onChange={async (e) => { const file = e.target.files?.[0]; if (!file || !id) return; if (file.size > 2 * 1024 * 1024) { setError(my ? 'ပုံဖိုင် 2 MB ထက် မကျော်ရပါ။' : 'Image must be no larger than 2 MB.'); return; } setBusy(true); try { const image = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Invalid image')); reader.onerror = reject; reader.readAsDataURL(file); }); setOrder((await proof({ data: { id, receipt: getReceipt(id), image } })).order); setError(''); } catch { setError(my ? 'အထောက်အထား မတင်နိုင်ပါ။ ပြန်စမ်းပါ။' : 'Could not submit evidence. Retry.'); } finally { setBusy(false); } }} />{order.payment_proof && <img src={order.payment_proof} alt={my ? 'ငွေလွှဲအထောက်အထား' : 'Payment evidence'} className="max-h-80 max-w-full object-contain" />}</section>}</>}</div>;
}