import { useState } from 'react';
import { Copy, MessageCircle } from 'lucide-react';
import type { CartItem } from '@/lib/cart';
import { useI18n } from '@/lib/i18n';
import { buildOrderMessage, isBuyerInfoComplete, PAYMENT_LABELS, telegramOrderUrl, type BuyerInfo } from '@/lib/shopping';
import { STORE_INFO } from '@/lib/storeInfo';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';

export default function TelegramOrder({ items, total, disabled }: { items: CartItem[]; total: number; disabled: boolean }) {
  const { t, language } = useI18n();
  const [notes, setNotes] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [buyer, setBuyer] = useState<BuyerInfo>({ name: '', phone: '', address: '', payment: 'kpay' });
  const complete = isBuyerInfoComplete(buyer);
  const message = buildOrderMessage(items, total, language, notes, buyer);
  const my = language === 'my';
  const update = (patch: Partial<BuyerInfo>) => { setBuyer((b) => ({ ...b, ...patch })); setCopyState('idle'); };
  const field = 'glass-input h-11 rounded-lg px-3 font-normal';
  return <Dialog>
    <DialogTrigger asChild><Button disabled={disabled} className="h-auto w-full whitespace-normal bg-primary-foreground py-3 text-primary hover:bg-accent"><MessageCircle />{t('prepareOrder')}</Button></DialogTrigger>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto">
      <DialogTitle>{t('orderReview')}</DialogTitle><DialogDescription>{t('orderPending')}</DialogDescription>
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
      <div className="grid gap-2 sm:grid-cols-2"><Button variant="outline" disabled={!complete} className="h-auto whitespace-normal py-3" onClick={async () => { try { await navigator.clipboard.writeText(message); setCopyState('copied'); } catch { setCopyState('failed'); } }}><Copy />{copyState === 'copied' ? t('copiedOrder') : t('copyOrder')}</Button>{complete ? <Button asChild className="h-auto whitespace-normal py-3"><a href={telegramOrderUrl(message, STORE_INFO.telegramUrl)} target="_blank" rel="noopener noreferrer"><MessageCircle />{t('openTelegram')}</a></Button> : <Button disabled className="h-auto whitespace-normal py-3"><MessageCircle />{t('openTelegram')}</Button>}</div>
      {copyState === 'failed' && <p role="status" className="text-sm text-destructive">{t('copyFailed')}</p>}
    </DialogContent>
  </Dialog>;
}