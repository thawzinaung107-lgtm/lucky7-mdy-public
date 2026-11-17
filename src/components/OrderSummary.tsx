import { useI18n } from '@/lib/i18n';
import { STATUS_MY, type Order } from '@/lib/order-rules';
import { PAYMENT_LABELS } from '@/lib/shopping';
import { formatMmk } from '@/lib/pricing';

export default function OrderSummary({ order }: { order: Order }) {
  const { language } = useI18n(); const my = language === 'my';
  const status = (s: string) => my ? STATUS_MY[s] ?? s : s.replaceAll('_', ' ');
  return <section className="flex min-w-0 flex-col gap-5">
    <header className="flex flex-col gap-2"><h1 className="text-2xl font-bold">{order.order_number}</h1><time className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString(my ? 'my-MM' : 'en-GB')}</time><p className="font-semibold text-primary">{status(order.status)}</p><p className="text-sm">{PAYMENT_LABELS[order.payment_method as keyof typeof PAYMENT_LABELS]?.[language]} · {status(order.payment_status)}</p></header>
    <div className="grid gap-2 border-y border-border py-4 text-sm"><p>{order.buyer_name} · {order.phone}</p><p className="whitespace-pre-wrap break-words">{order.address}</p>{order.buyer_notes && <p className="whitespace-pre-wrap break-words">{order.buyer_notes}</p>}</div>
    <ul className="divide-y divide-border">{order.items.map((i) => <li key={i.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-3 text-sm"><div className="min-w-0"><p className="font-semibold">{my ? i.name_my : i.name_en}</p><p className="text-muted-foreground">{my ? i.color_my : i.color_en} · {i.size_label} × {i.qty}</p><p className="text-xs text-muted-foreground">{my ? 'တင်ချိန် တစ်ထည်ဈေး' : 'Original unit price'}: {formatMmk(i.original_unit_price_mmk)}</p></div><div className="text-right tabular-nums"><p>{formatMmk(i.unit_price_mmk * i.qty)}</p><p className="text-xs text-muted-foreground">{formatMmk(i.unit_price_mmk)} / {my ? 'ထည်' : 'piece'}</p></div></li>)}</ul>
    <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 text-sm"><dt>{my ? 'ပစ္စည်းဖိုး' : 'Subtotal'}</dt><dd className="text-right">{formatMmk(order.subtotal_mmk)}</dd><dt>{my ? 'လျှော့ဈေး' : 'Discount'}</dt><dd className="text-right">− {formatMmk(order.discount_mmk)}</dd><dt>{my ? 'ပို့ခ' : 'Delivery'}</dt><dd className="text-right">{formatMmk(order.delivery_mmk)}</dd><dt className="font-semibold">{my ? 'စုစုပေါင်း' : 'Total'}</dt><dd className="text-right font-semibold">{formatMmk(order.final_total_mmk)}</dd></dl>
    {order.status === 'pending' && <p className="text-sm text-muted-foreground">{my ? 'ဆိုင်မှ လက်ကျန်၊ ပို့ခနှင့် နောက်ဆုံးကျသင့်ငွေကို အတည်ပြုပေးပါမည်။' : 'The shop will confirm availability, delivery cost and the final total.'}</p>}
    {order.public_notes && <p className="whitespace-pre-wrap break-words border-l-2 border-primary pl-3 text-sm">{order.public_notes}</p>}
    {order.cancellation_reason && <p className="text-sm text-destructive">{order.cancellation_reason}</p>}
    {order.shipped_at && <div className="border-t border-border pt-3 text-sm"><p>{order.delivery_service} · {order.tracking_number}</p><p>{my ? 'ပို့သည့်နေ့' : 'Shipped'}: {new Date(order.shipped_at).toLocaleDateString()}</p></div>}
    {order.completed_at && <p className="text-sm">{my ? 'လက်ခံရရှိသည့်နေ့' : 'Received'}: {new Date(order.completed_at).toLocaleDateString()}</p>}
  </section>;
}