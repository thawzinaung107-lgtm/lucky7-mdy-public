import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { ProductDetail } from '@/types/catalog';
import {
  loadServerCart,
  saveServerCart,
  type ServerCartItem,
} from '@/lib/cartServer';

export interface CartItem {
  variantId: string;
  productId: string;
  productSlug: string;
  nameMy: string;
  nameEn: string;
  colorMy: string;
  colorEn: string;
  sizeLabel: string;
  unitPriceMmk: number;
  stockQty: number;
  qty: number;
  imageUrl: string | null;
}

const PAYLOAD_KEYS = [
  'productId',
  'productSlug',
  'nameMy',
  'nameEn',
  'colorMy',
  'colorEn',
  'sizeLabel',
  'unitPriceMmk',
  'stockQty',
  'imageUrl',
] as const;

function toPayload(item: CartItem): Record<string, string | number | null> {
  const payload: Record<string, string | number | null> = {};
  for (const key of PAYLOAD_KEYS) {
    payload[key] = item[key];
  }
  return payload;
}

function fromServerItem(entry: ServerCartItem): CartItem | null {
  const payload = entry.payload;
  const productId = payload.productId;
  const productSlug = payload.productSlug;
  const nameMy = payload.nameMy;
  const nameEn = payload.nameEn;
  const colorMy = payload.colorMy;
  const colorEn = payload.colorEn;
  const sizeLabel = payload.sizeLabel;
  const unitPriceMmk = payload.unitPriceMmk;
  const stockQty = payload.stockQty;
  const imageUrl = payload.imageUrl;
  if (
    typeof productId !== 'string' ||
    typeof productSlug !== 'string' ||
    typeof nameMy !== 'string' ||
    typeof nameEn !== 'string' ||
    typeof colorMy !== 'string' ||
    typeof colorEn !== 'string' ||
    typeof sizeLabel !== 'string' ||
    typeof unitPriceMmk !== 'number' ||
    typeof stockQty !== 'number' ||
    (imageUrl !== null && typeof imageUrl !== 'string')
  ) {
    return null;
  }
  return {
    variantId: entry.variantId,
    productId,
    productSlug,
    nameMy,
    nameEn,
    colorMy,
    colorEn,
    sizeLabel,
    unitPriceMmk,
    stockQty,
    qty: entry.qty,
    imageUrl,
  };
}

interface CartValue {
  items: CartItem[];
  totalQty: number;
  ready: boolean;
  addItem: (product: ProductDetail, quantities: Record<string, number>) => void;
  setQty: (variantId: string, qty: number) => void;
  removeItem: (variantId: string) => void;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const loadedRef = useRef(false);
  const itemsRef = useRef<CartItem[]>(items);
  itemsRef.current = items;

  useEffect(() => {
    let active = true;
    loadServerCart()
      .then((entries) => {
        if (!active) return;
        const restored = entries
          .map(fromServerItem)
          .filter((item): item is CartItem => item !== null);
        setItems(restored);
        loadedRef.current = true;
        setReady(true);
      })
      .catch(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = null;
      saveServerCart(
        itemsRef.current.map((item) => ({ variantId: item.variantId, qty: item.qty, payload: toPayload(item) })),
      ).catch(() => undefined);
    }, 600);
    return () => {
      if (saveTimer.current !== null) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [items]);

  const mergeItems = useCallback((current: CartItem[], additions: CartItem[]): CartItem[] => {
    const next = new Map(current.map((item) => [item.variantId, item]));
    for (const addition of additions) {
      const existing = next.get(addition.variantId);
      const merged: CartItem = existing
        ? { ...addition, qty: Math.min(existing.qty + addition.qty, addition.stockQty) }
        : addition;
      next.set(merged.variantId, merged);
    }
    return Array.from(next.values());
  }, []);

  const addItem = useCallback(
    (product: ProductDetail, quantities: Record<string, number>) => {
      const additions: CartItem[] = [];
      for (const variant of product.variants) {
        const requested = quantities[variant.id] ?? 0;
        if (requested <= 0) continue;
        additions.push({
          variantId: variant.id,
          productId: product.id,
          productSlug: product.slug,
          nameMy: product.nameMy,
          nameEn: product.nameEn,
          colorMy: variant.colorMy,
          colorEn: variant.colorEn,
          sizeLabel: variant.sizeLabel,
          unitPriceMmk: product.retailPriceMmk,
          stockQty: variant.stockQty,
          qty: Math.min(requested, variant.stockQty),
          imageUrl: product.primaryImageUrl,
        });
      }
      if (additions.length > 0) {
        setItems((prev) => mergeItems(prev, additions));
      }
    },
    [mergeItems],
  );

  const setQty = useCallback((variantId: string, qty: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.variantId === variantId
          ? { ...item, qty: Math.min(Math.max(qty, 0), item.stockQty) }
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((item) => item.variantId !== variantId));
  }, []);

  const totalQty = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);

  const value = useMemo<CartValue>(
    () => ({ items, totalQty, ready, addItem, setQty, removeItem }),
    [items, totalQty, ready, addItem, setQty, removeItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
