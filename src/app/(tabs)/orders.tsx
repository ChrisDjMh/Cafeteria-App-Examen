import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';

import { PAYMENT_LABELS, STATUS_COLORS, STATUS_LABELS } from '../../config/orderStatus';
import { colors } from '../../config/theme';
import { getAuthErrorMessage } from '../../services/authService';
import { subscribeToUserOrders } from '../../services/orderService';
import { useAuthStore } from '../../store/authStore';
import type { Order } from '../../types/models';
import { formatPrice } from '../../utils/format';

export default function OrdersScreen() {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserOrders(
      user.uid,
      (list) => {
        setOrders(list);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        Alert.alert('No se pudieron cargar los pedidos', getAuthErrorMessage(error));
      },
    );
    return unsubscribe;
  }, [user]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 56 }}>🧾</Text>
        <Text style={styles.emptyTitle}>Aún no tienes pedidos</Text>
        <Text style={styles.muted}>Cuando compres algo, aparecerá aquí.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={orders}
      keyExtractor={(o) => o.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.orderId}>Pedido #{item.id.slice(0, 6).toUpperCase()}</Text>
              <Text style={styles.date}>
                {item.createdAt.toDate().toLocaleString('es-MX', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <Text style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] }]}>
              {STATUS_LABELS[item.status]}
            </Text>
          </View>

          {item.items.map((line, i) => (
            <View key={`${line.productId}-${i}`} style={styles.line}>
              <View style={{ flex: 1 }}>
                <Text style={styles.lineName}>
                  {line.quantity} × {line.name}
                </Text>
                {line.selectedOptions.length > 0 && (
                  <Text style={styles.lineOptions}>
                    {line.selectedOptions.map((o) => o.label).join(' · ')}
                  </Text>
                )}
              </View>
            </View>
          ))}

          <View style={styles.footer}>
            <Text style={styles.muted}>
              {PAYMENT_LABELS[item.paymentMethod]}
              {item.couponCode ? ` · Cupón ${item.couponCode}` : ''}
            </Text>
            <Text style={styles.total}>{formatPrice(item.total)}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 8 },
  muted: { color: colors.muted, marginTop: 4 },
  card: { padding: 14, marginBottom: 12, borderRadius: 12, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 16, fontWeight: '700', color: colors.text },
  date: { fontSize: 12, color: colors.muted, marginTop: 2 },
  badge: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  line: { flexDirection: 'row', marginTop: 10 },
  lineName: { fontSize: 14, fontWeight: '600', color: colors.text },
  lineOptions: { fontSize: 12, color: colors.muted, marginTop: 2 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  total: { fontSize: 18, fontWeight: '700', color: colors.primary },
});