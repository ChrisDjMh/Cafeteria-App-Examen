import * as Notifications from 'expo-notifications';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useRef } from 'react';

import { db } from '../config/firebase';
import { STATUS_FLOW } from '../config/orderStatus';
import type { Order, OrderStatus } from '../types/models';
import { subscribeToUserOrders } from './orderService';

// Pon esto en false para apagar la simulación (demo real o producción).
export const SIMULATE_ORDER_PROGRESS = true;
// Segundos entre un estado y el siguiente.
export const STEP_SECONDS = 30;

const NOTIFICATION_TEXT: Record<OrderStatus, string> = {
  pending: 'Recibimos tu pedido.',
  preparing: 'Estamos preparando tu pedido.',
  ready: '¡Tu pedido está listo!',
  on_the_way: 'Tu pedido va en camino.',
  delivered: 'Pedido entregado. ¡Gracias!',
};

/**
 * Programa una notificación local por cada cambio de estado (30 s, 60 s, ...).
 * Se disparan aunque la app esté cerrada.
 */
export async function scheduleOrderNotifications(orderId: string) {
  if (!SIMULATE_ORDER_PROGRESS) return;
  try {
    for (let i = 1; i < STATUS_FLOW.length; i++) {
      const status = STATUS_FLOW[i];
      await Notifications.scheduleNotificationAsync({
        identifier: `${orderId}-${status}`,
        content: {
          title: 'BeanCraft Coffee',
          body: NOTIFICATION_TEXT[status],
          data: { orderId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: i * STEP_SECONDS,
          channelId: 'default',
        },
      });
    }
  } catch (e) {
    console.warn('No se pudieron programar las notificaciones del pedido:', e);
  }
}

/**
 * Mantiene los pedidos al día: cada 5 s revisa cuánto tiempo pasó desde que se
 * creó cada pedido y, si va atrasado, actualiza su estado en Firestore.
 */
export function useOrderSimulation(uid: string | undefined) {
  const ordersRef = useRef<Order[]>([]);
  const sentRef = useRef(new Map<string, number>());

  useEffect(() => {
    if (!SIMULATE_ORDER_PROGRESS || !uid) return;

    const sync = () => {
      const now = Date.now();
      for (const order of ordersRef.current) {
        const current = STATUS_FLOW.indexOf(order.status);
        if (current < 0 || current >= STATUS_FLOW.length - 1) continue;

        const elapsedSteps = Math.floor(
          (now - order.createdAt.toMillis()) / (STEP_SECONDS * 1000),
        );
        const expected = Math.min(elapsedSteps, STATUS_FLOW.length - 1);
        if (expected <= current) continue;
        if ((sentRef.current.get(order.id) ?? -1) >= expected) continue;

        sentRef.current.set(order.id, expected);
        updateDoc(doc(db, 'orders', order.id), {
          status: STATUS_FLOW[expected],
          updatedAt: serverTimestamp(),
        }).catch(() => sentRef.current.delete(order.id));
      }
    };

    const unsubscribe = subscribeToUserOrders(
      uid,
      (list) => {
        ordersRef.current = list;
        sync();
      },
      () => {},
    );
    const timer = setInterval(sync, 5000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [uid]);
}