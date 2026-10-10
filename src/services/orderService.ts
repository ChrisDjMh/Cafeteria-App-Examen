import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore';

import { db } from '../config/firebase';
import { nextStatus } from '../config/orderStatus';
import type { Order, OrderItem, OrderStatus, PaymentMethod } from '../types/models';

export interface NewOrderInput {
  userId: string;
  branchId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  total: number;
  paymentMethod: PaymentMethod;
}

export async function createOrder(input: NewOrderInput): Promise<string> {
  const { couponCode, ...rest } = input;
  const ref = await addDoc(collection(db, 'orders'), {
    ...rest,
    // Firestore no acepta valores undefined, por eso solo se agrega si existe.
    ...(couponCode ? { couponCode } : {}),
    status: 'pending' as OrderStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Escucha en vivo los pedidos del usuario, del más reciente al más antiguo.
 * Se ordena en el cliente para no tener que crear un índice en Firestore.
 */
export function subscribeToUserOrders(
  userId: string,
  onData: (orders: Order[]) => void,
  onError: (error: Error) => void,
) {
  const q = query(collection(db, 'orders'), where('userId', '==', userId));

  return onSnapshot(
    q,
    (snap) => {
      const orders = snap.docs.map(
        (d) =>
          ({
            id: d.id,
            ...d.data({ serverTimestamps: 'estimate' }),
          }) as Order,
      );
      orders.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      onData(orders);
    },
    onError,
  );
}

/** Demo: pasa el pedido al siguiente estado. */
export async function advanceOrderStatus(orderId: string, current: OrderStatus) {
  const next = nextStatus(current);
  if (!next) return;
  await updateDoc(doc(db, 'orders', orderId), {
    status: next,
    updatedAt: serverTimestamp(),
  });
}