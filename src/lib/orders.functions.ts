import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { createOrderSchema, receiptSchema, type Order, type OrderEvent } from '@/lib/order-rules';

async function digest(value: string) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}
type Db = Awaited<typeof import('@/integrations/supabase/client.server')>['supabaseAdmin'];
async function buyerAccess(db: Db, id: string, receipt?: string) {
  const { data: row, error } = await db.from('orders').select('*').eq('id', id).maybeSingle();
  if (error || !row) throw new Error('Order not found');
  if (receipt && await digest(receipt) === row.receipt_hash) return row;
  const token = getRequestHeader('Authorization')?.replace(/^Bearer /i, '');
  if (token) { const { data } = await db.auth.getUser(token); if (data.user && row.user_id === data.user.id) return row; }
  throw new Error('Order not found');
}
async function detail(db: Db, id: string, staff = false): Promise<{ order: Order; events: OrderEvent[] }> {
  const [o, i, e] = await Promise.all([db.from('orders').select('*').eq('id', id).single(), db.from('order_items').select('*').eq('order_id', id).order('id'), staff ? db.from('order_events').select('*').eq('order_id', id).order('created_at', { ascending: false }) : Promise.resolve({ data: [], error: null })]);
  if (o.error || i.error || e.error) throw new Error(o.error?.message ?? i.error?.message ?? e.error?.message);
  const { receipt_hash: _hash, request_key: _key, staff_notes, ...safe } = o.data;
  return { order: { ...safe, ...(staff ? { staff_notes } : {}), items: i.data ?? [] }, events: e.data ?? [] };
}
export const submitOrder = createServerFn({ method: 'POST' }).inputValidator((v: z.infer<typeof createOrderSchema>) => createOrderSchema.parse(v)).handler(async ({ data }) => {
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  let userId: string | null = null;
  const token = getRequestHeader('Authorization')?.replace(/^Bearer /i, '');
  if (token) { const { data: u } = await db.auth.getUser(token); userId = u.user?.id ?? null; }
  const { data: id, error } = await db.rpc('create_pending_order', { p_request: data.requestKey, p_receipt: await digest(data.receipt), p_user: userId as string, p_buyer: data.buyer, p_items: data.items, p_notes: data.notes });
  if (error || !id) throw new Error(error?.message ?? 'Could not save order');
  return detail(db, id);
});
export const buyerOrder = createServerFn({ method: 'POST' }).inputValidator((v: z.infer<typeof receiptSchema>) => receiptSchema.parse(v)).handler(async ({ data }) => {
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  await buyerAccess(db, data.id, data.receipt); return detail(db, data.id);
});
export const myOrders = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const { data, error } = await db.from('orders').select('id,order_number,status,payment_status,final_total_mmk,created_at').eq('user_id', context.userId).order('created_at', { ascending: false }).limit(100);
  if (error) throw new Error(error.message); return data;
});
export const sendPaymentProof = createServerFn({ method: 'POST' }).inputValidator((v: { id: string; receipt?: string | undefined; image: string }) => receiptSchema.extend({ image: z.string().max(2800000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/) }).parse(v)).handler(async ({ data }) => {
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const row = await buyerAccess(db, data.id, data.receipt);
  if (row.payment_method === 'cod' || !['unpaid', 'verification_pending'].includes(row.payment_status) || ['cancelled', 'completed'].includes(row.status)) throw new Error('Payment evidence cannot be submitted for this order');
  const { error } = await db.rpc('submit_order_evidence', { p_id: row.id, p_revision: row.revision, p_image: data.image });
  if (error) throw new Error(error.message);
  return detail(db, data.id);
});
export const staffOrders = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: allowed } = await context.supabase.rpc('is_order_staff'); if (!allowed) throw new Error('Staff access required');
  const { data, error } = await context.supabase.from('orders').select('id,order_number,buyer_name,phone,status,payment_status,final_total_mmk,created_at').order('created_at', { ascending: false }).limit(200);
  if (error) throw new Error(error.message); return data;
});
export const staffOrder = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((v: { id: string }) => z.object({ id: z.string().uuid() }).parse(v)).handler(async ({ data, context }) => {
  const { data: allowed } = await context.supabase.rpc('is_order_staff'); if (!allowed) throw new Error('Staff access required');
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server'); return detail(db, data.id, true);
});
export const updateOrder = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((v: { id: string; revision: number; action: string; patch: Record<string, unknown> }) => z.object({ id: z.string().uuid(), revision: z.number().int().min(0), action: z.enum(['revise', 'status', 'payment', 'return']), patch: z.record(z.unknown()).refine((p) => JSON.stringify(p).length < 30000) }).parse(v)).handler(async ({ data, context }) => {
  const { data: allowed } = await context.supabase.rpc('is_order_staff'); if (!allowed) throw new Error('Staff access required');
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const { error } = await db.rpc('manage_order', { p_id: data.id, p_actor: context.userId, p_revision: data.revision, p_action: data.action, p_patch: data.patch as import('@/integrations/supabase/types').Json });
  if (error) throw new Error(error.message); return detail(db, data.id, true);
});