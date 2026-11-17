import { Copy, MessageCircle, Phone } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { buildOrderMessage, telegramOrderUrl, viberOrderUrl, type BuyerInfo } from '@/lib/shopping';
import { STORE_INFO } from '@/lib/storeInfo';
import type { CartItem } from '@/lib/cart';
import type { Order } from '@/lib/order-rules';

export default function OrderContact({ order }: { order: Order }) {
  const { language } = useI18n(); const my = language === 'my'; const [copied, setCopied] = useState(false); const [error, setError] = useState(false);
  const items = order.items.map((i) => ({ nameMy: i.name_my, nameEn: i.name_en, colorMy: i.color_my, colorEn: i.color_en, sizeLabel: i.size_label, qty: i.qty })) as CartItem[];
  const message = `${order.order_number}\n\n${buildOrderMessage(items, order.final_total_mmk, language, order.buyer_notes, { name: order.buyer_name, phone: order.phone, address: order.address, payment: order.payment_method as BuyerInfo['payment'] })}`;
  const copy = async () => { try { await navigator.clipboard.writeText(message); setCopied(true); setError(false); } catch { setError(true); } };
  return <section className="flex flex-col gap-3 border-t border-border pt-5"><div className="grid gap-2 sm:grid-cols-2"><Button asChild className="h-auto whitespace-normal py-3"><a href={telegramOrderUrl(message, STORE_INFO.telegramUrl)} target="_blank" rel="noopener noreferrer"><MessageCircle />{my ? 'Telegram Bot မှ အော်ဒါပို့မည်' : 'Send via Telegram bot'}</a></Button><Button asChild variant="secondary" className="h-auto whitespace-normal py-3"><a href={viberOrderUrl(message, STORE_INFO.viberNumber)} onClick={() => { void copy(); }}><Phone />{my ? 'Viber မှ အော်ဒါပို့မည်' : 'Send via Viber'}</a></Button></div><Button variant="outline" onClick={() => { void copy(); }}><Copy />{copied ? (my ? 'ကူးယူပြီး' : 'Copied') : (my ? 'အော်ဒါစာသား ကူးယူမည်' : 'Copy order')}</Button><textarea readOnly aria-label={my ? 'အော်ဒါစာသား' : 'Order message'} value={message} className="glass-input min-h-32 w-full rounded-lg p-3 text-sm" /><p className="text-xs text-muted-foreground">{my ? `Viber မပွင့်ပါက စာသားကူးပြီး ${STORE_INFO.viberNumber} သို့ ပို့ပါ။` : `If Viber does not open, copy the message to ${STORE_INFO.viberNumber}.`}</p>{error && <p role="status" className="text-sm text-destructive">{my ? 'စာသားကို ရွေးပြီး ကူးယူပေးပါ။' : 'Select and copy the message manually.'}</p>}</section>;
}