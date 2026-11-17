import { z } from 'zod';
import { isBuyerInfoComplete, type BuyerInfo } from '@/lib/shopping';
import type { Database } from '@/integrations/supabase/types';

export const ORDER_STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'completed', 'cancelled'] as const;
export const PAYMENT_STATUSES = ['unpaid', 'verification_pending', 'paid', 'refund_pending', 'refunded'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];
export type PaymentStatus = typeof PAYMENT_STATUSES[number];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type Order = Omit<Database['public']['Tables']['orders']['Row'], 'receipt_hash' | 'request_key' | 'staff_notes'> & { items: OrderItem[]; staff_notes?: string };
export type OrderEvent = Database['public']['Tables']['order_events']['Row'];
export const STATUS_MY: Record<string, string> = { pending: 'ဆိုင်အတည်ပြုချက် စောင့်ဆိုင်းနေသည်', confirmed: 'အတည်ပြုပြီး', packed: 'ထုပ်ပိုးပြီး', shipped: 'ပို့ဆောင်ပြီး', completed: 'လက်ခံရရှိပြီး', cancelled: 'ပယ်ဖျက်ပြီး', unpaid: 'ငွေမရသေး', verification_pending: 'ငွေလွှဲ စစ်ဆေးရန် စောင့်ဆိုင်းနေသည်', paid: 'ငွေရရှိပြီး', refund_pending: 'ငွေပြန်အမ်းရန် စောင့်ဆိုင်းနေသည်', refunded: 'ငွေပြန်အမ်းပြီး' };
export const buyerSchema = z.object({ name: z.string().trim().min(2).max(80), phone: z.string().max(20), address: z.string().trim().min(5).max(300), payment: z.enum(['kpay', 'wave', 'cod']) }).refine((b) => isBuyerInfoComplete(b as BuyerInfo), 'Invalid name, phone or address');
export const createOrderSchema = z.object({ requestKey: z.string().uuid(), receipt: z.string().regex(/^[a-f0-9]{64}$/), buyer: buyerSchema, notes: z.string().max(1000), items: z.array(z.object({ variantId: z.string().uuid(), qty: z.number().int().min(1).max(9999) })).min(1).max(100) }).refine((v) => new Set(v.items.map((i) => i.variantId)).size === v.items.length, 'Duplicate variants');
export const receiptSchema = z.object({ id: z.string().uuid(), receipt: z.string().regex(/^[a-f0-9]{64}$/).optional() });
export function canShip(method: string, payment: string): boolean { return method === 'cod' ? ['unpaid', 'paid'].includes(payment) : payment === 'paid'; }
export function nextStatuses(status: string): OrderStatus[] {
  if (status === 'pending') return ['confirmed', 'cancelled'];
  if (status === 'confirmed') return ['packed', 'cancelled'];
  if (status === 'packed') return ['shipped', 'cancelled'];
  if (status === 'shipped') return ['completed'];
  return [];
}
export function inventoryAfter(physical: number, reserved: number, qty: number, action: 'confirm' | 'ship' | 'cancel' | 'complete') {
  if (qty < 1 || reserved < 0 || physical < reserved) throw new Error('Invalid inventory');
  if (action === 'confirm') { if (physical - reserved < qty) throw new Error('Insufficient stock'); reserved += qty; }
  if (action === 'ship' || action === 'cancel') { if (reserved < qty) throw new Error('Missing reservation'); reserved -= qty; }
  if (action === 'ship') physical -= qty;
  return { physical, reserved, available: physical - reserved };
}