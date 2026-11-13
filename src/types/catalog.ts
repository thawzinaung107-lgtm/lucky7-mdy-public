export type CustomerGroup = 'retail' | 'wholesale';

export interface Category {
  id: string;
  slug: string;
  nameMy: string;
  nameEn: string;
  sortOrder: number;
}

export interface PriceTier {
  customerGroup: CustomerGroup;
  minQty: number;
  unitPriceMmk: number;
}

export interface Variant {
  id: string;
  sku: string;
  colorMy: string;
  colorEn: string;
  sizeLabel: string;
  stockQty: number;
  isActive: boolean;
}

export interface ProductSummary {
  id: string;
  slug: string;
  categoryId: string | null;
  nameMy: string;
  nameEn: string;
  summaryMy: string;
  summaryEn: string;
  retailPriceMmk: number;
  moq: number;
  orderStep: number;
  primaryImageUrl: string;
  priceTiers: PriceTier[];
  createdAt: string;
}

export interface ProductDetail extends ProductSummary {
  variants: Variant[];
}
