import { describe, expect, it } from 'vitest';
import { canShip, createOrderSchema, inventoryAfter, nextStatuses } from '@/lib/order-rules';
describe('Document order rules', () => {
  it('reserves 3 from physical 10 leaving 7 available', () => expect(inventoryAfter(10, 0, 3, 'confirm')).toEqual({ physical: 10, reserved: 3, available: 7 }));
  it('shipping 3 leaves physical 7 reserved 0 available 7', () => expect(inventoryAfter(10, 3, 3, 'ship')).toEqual({ physical: 7, reserved: 0, available: 7 }));
  it('completion does not deduct stock again', () => expect(inventoryAfter(7, 0, 3, 'complete')).toEqual({ physical: 7, reserved: 0, available: 7 }));
  it('cancellation releases reservation', () => expect(inventoryAfter(10, 3, 3, 'cancel')).toEqual({ physical: 10, reserved: 0, available: 10 }));
  it('concurrent demand cannot reserve more than available', () => expect(() => inventoryAfter(10, 3, 8, 'confirm')).toThrow('Insufficient stock'));
  it('shipped orders cannot cancel', () => { expect(nextStatuses('shipped')).toEqual(['completed']); expect(nextStatuses('cancelled')).toEqual([]); });
  it('KBZPay must be Paid before shipment', () => { expect(canShip('kpay', 'unpaid')).toBe(false); expect(canShip('kpay', 'verification_pending')).toBe(false); expect(canShip('kpay', 'paid')).toBe(true); });
  it('WavePay must be Paid before shipment', () => { expect(canShip('wave', 'unpaid')).toBe(false); expect(canShip('wave', 'paid')).toBe(true); });
  it('COD can ship Unpaid but not during refund', () => { expect(canShip('cod', 'unpaid')).toBe(true); expect(canShip('cod', 'refund_pending')).toBe(false); });
  it('duplicate variant lines are rejected at request boundary', () => { const value = { requestKey: '00000000-0000-4000-8000-000000000001', receipt: 'a'.repeat(64), buyer: { name: 'Su Su', phone: '09123456789', address: 'Mandalay township', payment: 'cod' }, notes: '', items: [{ variantId: '00000000-0000-4000-8000-000000000002', qty: 2 }, { variantId: '00000000-0000-4000-8000-000000000002', qty: 2 }] }; expect(createOrderSchema.safeParse(value).success).toBe(false); });
});