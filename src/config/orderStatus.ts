import type { OrderStatus, PaymentMethod } from '../types/models';

export const STATUS_FLOW: OrderStatus[] = [
  'pending',
  'preparing',
  'ready',
  'on_the_way',
  'delivered',
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Recibido',
  preparing: 'Preparando',
  ready: 'Listo',
  on_the_way: 'En camino',
  delivered: 'Entregado',
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'colors.muted',
  preparing: '#C77D0A',
  ready: '#2E7D32',
  on_the_way: '#1565C0',
  delivered: '#4E342E',
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
};

export const nextStatus = (status: OrderStatus): OrderStatus | null =>
  STATUS_FLOW[STATUS_FLOW.indexOf(status) + 1] ?? null;