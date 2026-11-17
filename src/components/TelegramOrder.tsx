import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { Copy, MessageCircle, Phone } from 'lucide-react';
import type { CartItem } from '@/lib/cart';
import { useI18n } from '@/lib/i18n';
import { buildOrderMessage, isBuyerInfoComplete, PAYMENT_LABELS, telegramOrderUrl, viberOrderUrl, type BuyerInfo } from '@/lib/shopping';
import { STORE_INFO } from '@/lib/storeInfo';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { submitOrder } from '@/lib/orders.functions';
import { saveReceipt, orderAttempt, clearOrderAttempt } from '@/lib/order-receipts';
import type { Order } from '@/lib/order-rules';
import OrderSummary from '@/components/OrderSummary';
import OrderContact from '@/components/OrderContact';
import { Link } from '@/lib/router';

export default function TelegramOrder({ items, total, disabled }: { items: CartItem[]; total: number; disabled: boolean }) {
  const { t, language } = useI18n();
  const submit = useServerFn(submitOrder);
  const [saved, setSaved] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [request, setRequest] = useState<{ requestKey: string; receipt: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [buyer, setBuyer] = useState<BuyerInfo>({ name: '', phone: '', address: '', payment: 'kpay' });
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => { const m = data.user?.user_metadata ?? {}; const s = (v: unknown) => (typeof v === 'string' ? v : ''); setBuyer((b) => ({ ...b, name: b.name || s(m.buyer_name ?? m.full_name ?? m.name), phone: b.phone || s(m.viber_phone), address: b.address || s(m.address) })); if (m.viber_phone || m.address) setPrefilled(true); }); }, []);
  const [prefilled, setPrefilled] = useState(false);
  const complete = isBuyerInfoComplete(buyer);
  const message = buildOrderMessage(items, total, language, notes, buyer);
  const my = language === 'my';
  const update = (patch: Partial<BuyerInfo>) => { setBuyer((b) => ({ ...b, ...patch })); setCopyState('idle'); };
  const field = 'glass-input h-11 rounded-lg px-3 font-normal';
  return <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && !saved) setRequest(orderAttempt(items.map((i) => `${i.variantId}:${i.qty}`).sort().join('|'))); }}>
    <DialogTrigger asChild><Button disabled={disabled} className="h-auto w-full whitespace-normal bg-primary-foreground py-3 text-primary hover:bg-accent"><MessageCircle />{t('prepareOrder')}</Button></DialogTrigger>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto">
      <DialogTitle>{saved ? saved.order_number : t('orderReview')}</DialogTitle><DialogDescription>{saved ? (my ? 'ဆိုင်အတည်ပြုချက် စောင့်ဆိုင်းနေသည်' : 'Waiting for shop confirmation') : t('orderPending')}</DialogDescription>
      {saved ? <><OrderSummary order={saved} /><OrderContact order={saved} /><Button asChild variant="outline"><Link to={`/orders/${saved.id}`} onClick={() => setOpen(false)}>{my ? 'အော်ဒါအသေးစိတ် ကြည့်မည်' : 'View saved order'}</Link></Button><Button variant="ghost" onClick={() => { clearOrderAttempt(); setSaved(null); setRequest(orderAttempt(items.map((i) => `${i.variantId}:${i.qty}`).sort().join('|'))); }}>{my ? 'အော်ဒါအသစ် စတင်မည်' : 'Start a new order'}</Button></> : <>
      {prefilled && <p className="text-xs text-muted-foreground">{my ? 'သိမ်းထားသော ဖုန်းနှင့်လိပ်စာကို ဖြည့်ထားပါသည်။ ဒီအော်ဒါအတွက် လိုသလို ပြင်နိုင်ပါသည်။' : 'Your saved phone and address are filled in. Edit them for this order if needed.'}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-semibold">{my ? 'ဝယ်သူအမည်' : 'Your name'}<input value={buyer.name} maxLength={80} autoComplete="name" onChange={(e) => update({ name: e.target.value })} className={field} /></label>
        <label className="flex flex-col gap-2 text-sm font-semibold">{my ? 'ဖုန်းနံပါတ်' : 'Phone number'}<input value={buyer.phone} maxLength={20} inputMode="tel" autoComplete="tel" placeholder="09xxxxxxxxx" onChange={(e) => update({ phone: e.target.value })} className={field} /></label>
      </div>
      <label className="flex flex-col gap-2 text-sm font-semibold">{my ? 'ပို့ရမည့်လိပ်စာ (မြို့နယ်ပါ)' : 'Delivery address (with township)'}<textarea value={buyer.address} maxLength={300} autoComplete="street-address" onChange={(e) => update({ address: e.target.value })} className="glass-input min-h-16 rounded-lg p-3 font-normal" /></label>
      <fieldset className="flex flex-col gap-2 text-sm font-semibold"><legend className="mb-2">{my ? 'ငွေပေးချေမည့်နည်း' : 'Payment method'}</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{(Object.keys(PAYMENT_LABELS) as BuyerInfo['payment'][]).map((key) => <label key={key} className={`glass-pill flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 font-normal ${buyer.payment === key ? 'ring-2 ring-primary' : ''}`}><input type="radio" name="payment" checked={buyer.payment === key} onChange={() => update({ payment: key })} />{PAYMENT_LABELS[key][language]}</label>)}</div>
      </fieldset>
      <label className="flex flex-col gap-2 text-sm font-semibold">{my ? 'အော်ဒါမှတ်ချက် (မဖြစ်မနေမဟုတ်)' : 'Order notes (optional)'}<textarea value={notes} maxLength={1000} onChange={(event) => { setNotes(event.target.value); setCopyState('idle'); }} className="glass-input min-h-20 rounded-lg p-3 font-normal" /></label>
      <textarea readOnly aria-label={t('orderReview')} value={message} className="glass-input min-h-56 w-full rounded-lg p-3 text-sm" />
      {!complete && <p role="status" className="text-sm text-destructive">{my ? 'အမည်၊ ဖုန်းနံပါတ် (09…) နှင့် လိပ်စာကို ဖြည့်ပါ။' : 'Please fill in your name, phone (09…) and address.'}</p>}
      {!STORE_INFO.telegramUrl && <p className="text-sm text-muted-foreground">{t('chooseRecipient')}</p>}
      <Button disabled={!complete || disabled || saving || !request} className="h-auto w-full whitespace-normal py-3" onClick={async () => { if (!request || saving) return; setSaving(true); setError(''); try { const result = await submit({ data: { ...request, buyer, notes, items: items.map((i) => ({ variantId: i.variantId, qty: i.qty })) } }); saveReceipt({ id: result.order.id, number: result.order.order_number, receipt: request.receipt }); setSaved(result.order); } catch (e) { setError(e instanceof Error ? e.message : (my ? 'အော်ဒါ မသိမ်းနိုင်ပါ။ ပြန်စမ်းပါ။' : 'Could not save order. Retry.')); } finally { setSaving(false); } }}><MessageCircle />{saving ? (my ? 'သိမ်းနေသည်…' : 'Saving…') : (my ? 'အော်ဒါတောင်းဆိုမှု တင်မည်' : 'Submit order request')}</Button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {copyState === 'failed' && <p role="status" className="text-sm text-destructive">{t('copyFailed')}</p>}
      </>}
    </DialogContent>
  </Dialog>;
}