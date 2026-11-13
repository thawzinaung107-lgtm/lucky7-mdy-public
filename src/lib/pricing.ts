import type { PriceTier } from '@/types/catalog';

export type QuantityIssue = 'below_moq' | 'off_step';

export function formatMmk(amount: number): string {
  return `MMK ${amount.toLocaleString('en-US')}`;
}

export function getWholesaleOffer(tiers: PriceTier[]): { unitPriceMmk: number; minQty: number } | null {
  const wholesale = tiers.filter((tier) => tier.customerGroup === 'wholesale');
  if (wholesale.length === 0) return null;
  const best = wholesale.reduce((lowest, tier) =>
    tier.unitPriceMmk < lowest.unitPriceMmk ? tier : lowest,
  );
  return { unitPriceMmk: best.unitPriceMmk, minQty: best.minQty };
}

export function checkQuantity(totalQty: number, moq: number, orderStep: number): QuantityIssue | null {
  if (totalQty < moq) return 'below_moq';
  if (totalQty % orderStep !== 0) return 'off_step';
  return null;
}
