import type { Timestamp } from 'firebase/firestore';

export type ProductCategory = 'coffee' | 'cold' | 'bakery';

export interface Option {
  id: string;
  label: string;
  priceDelta: number;
}

export interface OptionGroup {
  id: string;
  label: string;
  required: boolean;
  multiple: boolean;
  options: Option[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  basePrice: number;
  imageUrl: string;
  available: boolean;
  optionGroups: OptionGroup[];
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  favoriteBranchId?: string;
  fcmToken?: string;
  biometricEnabled: boolean;
  createdAt: Timestamp;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  openHours: string;
}

export interface Coupon {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  active: boolean;
  expiresAt: Timestamp;
}

export type PaymentMethod = 'cash' | 'card';

export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'on_the_way'
  | 'delivered';

export interface SelectedOption {
  groupId: string;
  optionId: string;
  label: string;
  priceDelta: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  selectedOptions: SelectedOption[];
  lineTotal: number;
}

export interface Order {
  id: string;
  userId: string;
  branchId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}