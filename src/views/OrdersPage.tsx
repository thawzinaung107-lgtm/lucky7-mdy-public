import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Link } from '@/lib/router';
import { myOrders } from '@/lib/orders.functions';
import { readReceipts, type SavedReceipt } from '@/lib/order-receipts';
import { STATUS_MY } from '@/lib/order-rules';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { formatMmk } from '@/lib/pricing';
import { Button } from '@/components/ui/button';

export default function OrdersPage() {
  const { language } = useI18n(); const my = language === 'my'; const load = useServerFn(myOrders);
  const [local, setLocal] = useState<SavedReceipt[]>([]); const [rows, setRows] = useState<Awaited<ReturnType<typeof myOrders>>>([]); const [error, setError] = useState('');
  useEffect(() => { setLocal(readReceipts()); void supabase.auth.getSession().then(async ({ data }) => { if (data.session) { try { setRows(await load()); } catch { setError(my ? 'အော်ဒါစာရင်း မဖွင့်နိုင်သေးပါ။' : 'Could not load orders.'); } } }); }, [load, my]);
  const known = new Set(rows.map((r) => r.id));
  return <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-10"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">{my ? 'ကျွန်ုပ်၏ အော်ဒါများ' : 'My orders'}</h1><Button asChild variant="outline"><Link to="/admin/orders">{my ? 'ဆိုင် အော်ဒါစီမံရန်' : 'Staff orders'}</Link></Button></div>{error && <p className="text-destructive">{error}</p>}<ul className="divide-y divide-border">{rows.map((r) => <li key={r.id}><Link to={`/orders/${r.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-4"><div><p className="font-semibold">{r.order_number}</p><p className="text-sm text-muted-foreground">{my ? STATUS_MY[r.status] : r.status}</p></div><p className="text-sm">{formatMmk(r.final_total_mmk)}</p></Link></li>)}{local.filter((r) => !known.has(r.id)).map((r) => <li key={r.id}><Link to={`/orders/${r.id}`} className="block py-4 font-semibold">{r.number}</Link></li>)}</ul>{!rows.length && !local.length && <p className="text-muted-foreground">{my ? 'အော်ဒါ မရှိသေးပါ။' : 'No orders yet.'}</p>}</div>;
}