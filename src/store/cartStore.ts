import { create } from 'zustand';

import type { AppliedCoupon } from '../services/couponService';
import type { OrderItem, ProductCategory } from '../types/models';

export interface CartItem extends OrderItem {
  key: string; // productId + opciones: dos configuraciones distintas no se mezclan
  category: ProductCategory;
  imageUrl?: string;
}

type NewItem = Omit<CartItem, 'key' | 'lineTotal'>;

export interface SelectedBranch {
  id: string;
  name: string;
}

interface CartState {
  items: CartItem[];
  coupon: AppliedCoupon | null;
  selectedBranch: SelectedBranch | null;
  addItem: (item: NewItem) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  removeItem: (key: string) => void;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  setBranch: (branch: SelectedBranch) => void;
  clear: () => void;
}

const buildKey = (
  productId: string,
  options: { groupId: string; optionId: string }[],
) =>
  `${productId}|${options
    .map((o) => `${o.groupId}:${o.optionId}`)
    .sort()
    .join(',')}`;

export const useCartStore = create<CartState>((set) => ({
  items: [],
  coupon: null,
  selectedBranch: null,

  addItem: (item) =>
    set((state) => {
      const key = buildKey(item.productId, item.selectedOptions);
      const existing = state.items.find((i) => i.key === key);

      // Misma configuración: solo suma la cantidad.
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.key === key
              ? {
                  ...i,
                  quantity: i.quantity + item.quantity,
                  lineTotal: (i.quantity + item.quantity) * i.unitPrice,
                }
              : i,
          ),
        };
      }

      return {
        items: [
          ...state.items,
          { ...item, key, lineTotal: item.unitPrice * item.quantity },
        ],
      };
    }),

  increment: (key) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.key === key
          ? { ...i, quantity: i.quantity + 1, lineTotal: (i.quantity + 1) * i.unitPrice }
          : i,
      ),
    })),

  decrement: (key) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.key === key && i.quantity > 1
          ? { ...i, quantity: i.quantity - 1, lineTotal: (i.quantity - 1) * i.unitPrice }
          : i,
      ),
    })),

  removeItem: (key) =>
    set((state) => ({ items: state.items.filter((i) => i.key !== key) })),

  applyCoupon: (coupon) => set({ coupon }),
  removeCoupon: () => set({ coupon: null }),
  setBranch: (branch) => set({ selectedBranch: branch }),

  // Tras un pedido se vacía el carrito y el cupón; la sucursal se conserva.
  clear: () => set({ items: [], coupon: null }),
}));

export function computeDiscount(coupon: AppliedCoupon | null, subtotal: number) {
  if (!coupon) return 0;
  const raw = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
  return Math.round(Math.min(raw, subtotal) * 100) / 100;
}

export const selectSubtotal = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.lineTotal, 0);

export const selectDiscount = (s: CartState) =>
  computeDiscount(s.coupon, selectSubtotal(s));

export const selectTotal = (s: CartState) =>
  Math.round((selectSubtotal(s) - selectDiscount(s)) * 100) / 100;

export const selectCount = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.quantity, 0);