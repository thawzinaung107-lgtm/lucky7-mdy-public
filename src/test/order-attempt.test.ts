import { beforeEach, expect, it } from 'vitest';
import { clearOrderAttempt, orderAttempt } from '@/lib/order-receipts';
beforeEach(() => localStorage.clear());
it('reuses the same request after a retry or reload', () => {
  const first = orderAttempt('variant:2');
  expect(orderAttempt('variant:2')).toEqual(first);
});
it('creates a new request when the buyer starts a new order', () => {
  const first = orderAttempt('variant:2');
  clearOrderAttempt();
  expect(orderAttempt('variant:2').requestKey).not.toBe(first.requestKey);
});
it('does not reuse a request for changed cart contents', () => {
  const first = orderAttempt('variant:2');
  expect(orderAttempt('variant:3').requestKey).not.toBe(first.requestKey);
});