import { supabase } from '@/integrations/supabase/client';
import type {
  Category,
  CustomerGroup,
  PriceTier,
  ProductDetail,
  ProductSummary,
  Variant,
} from '@/types/catalog';

interface CategoryRow {
  id: string;
  slug: string;
  name_my: string;
  name_en: string;
  sort_order: number;
}

interface TierRow {
  customer_group: CustomerGroup;
  min_qty: number;
  unit_price_mmk: number;
}

interface VariantRow {
  id: string;
  sku: string;
  color_my: string;
  color_en: string;
  size_label: string;
  stock_qty: number;
  is_active: boolean;
}

interface ProductRow {
  id: string;
  slug: string;
  category_id: string | null;
  name_my: string;
  name_en: string;
  summary_my: string;
  summary_en: string;
  retail_price_mmk: number | null;
  moq: number;
  order_step: number;
  primary_image_url: string | null;
  created_at: string;
  product_price_tiers: TierRow[] | null;
  product_variants?: VariantRow[] | null;
}

const PRODUCT_COLUMNS =
  'id, slug, category_id, name_my, name_en, summary_my, summary_en, retail_price_mmk, moq, order_step, primary_image_url, created_at, product_price_tiers(customer_group, min_qty, unit_price_mmk)';

function requireArray<T>(value: unknown, label: string): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`Unexpected response shape for ${label}`);
  }
  return value as T[];
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    nameMy: row.name_my,
    nameEn: row.name_en,
    sortOrder: row.sort_order,
  };
}

function mapTiers(rows: TierRow[] | null): PriceTier[] {
  return (rows ?? []).map((tier) => ({
    customerGroup: tier.customer_group,
    minQty: tier.min_qty,
    unitPriceMmk: tier.unit_price_mmk,
  }));
}

function mapVariant(row: VariantRow): Variant {
  return {
    id: row.id,
    sku: row.sku,
    colorMy: row.color_my,
    colorEn: row.color_en,
    sizeLabel: row.size_label,
    stockQty: row.stock_qty,
    isActive: row.is_active,
  };
}

function mapProduct(row: ProductRow): ProductSummary {
  if (row.retail_price_mmk === null || !row.primary_image_url) {
    throw new Error(`Published product ${row.slug} is missing price or image`);
  }
  return {
    id: row.id,
    slug: row.slug,
    categoryId: row.category_id,
    nameMy: row.name_my,
    nameEn: row.name_en,
    summaryMy: row.summary_my,
    summaryEn: row.summary_en,
    retailPriceMmk: row.retail_price_mmk,
    moq: row.moq,
    orderStep: row.order_step,
    primaryImageUrl: row.primary_image_url,
    priceTiers: mapTiers(row.product_price_tiers),
    createdAt: row.created_at,
  };
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name_my, name_en, sort_order')
    .order('sort_order', { ascending: true })
    .order('name_en', { ascending: true });
  if (error) throw new Error(error.message);
  return requireArray<CategoryRow>(data, 'categories').map(mapCategory);
}

export async function fetchPublishedProducts(): Promise<ProductSummary[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return requireArray<ProductRow>(data, 'products').map(mapProduct);
}

export async function fetchProductBySlug(slug: string): Promise<ProductDetail | null> {
  const { data, error } = await supabase
    .from('products')
    .select(
      `${PRODUCT_COLUMNS}, product_variants(id, sku, color_my, color_en, size_label, stock_qty, is_active)`,
    )
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as ProductRow;
  const variants = requireArray<VariantRow>(row.product_variants ?? [], 'variants');
  return {
    ...mapProduct(row),
    variants: variants.map(mapVariant).filter((variant) => variant.isActive),
  };
}
