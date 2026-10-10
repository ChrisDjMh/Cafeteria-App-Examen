import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../config/theme';
import { getAuthErrorMessage } from '../services/authService';
import { createOrder } from '../services/orderService';
import { scheduleOrderNotifications } from '../services/orderSimulation';
import { useAuthStore } from '../store/authStore';
import {
  selectDiscount,
  selectSubtotal,
  selectTotal,
  useCartStore,
} from '../store/cartStore';
import type { PaymentMethod } from '../types/models';
import { formatPrice } from '../utils/format';

const formatCardNumber = (v: string) =>
  v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export default function CheckoutScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);
  const branch = useCartStore((s) => s.selectedBranch);
  const subtotal = useCartStore(selectSubtotal);
  const discount = useCartStore(selectDiscount);
  const total = useCartStore(selectTotal);
  const clear = useCartStore((s) => s.clear);

  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false);

  if (items.length === 0 || !branch) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>No hay nada que pagar</Text>
        <Text style={styles.muted}>
          {items.length === 0 ? 'Tu carrito está vacío.' : 'Elige una sucursal desde el carrito.'}
        </Text>
        <View style={{ width: '100%', marginTop: 16 }}>
          <PrimaryButton title="Volver al carrito" onPress={() => router.replace('/cart')} />
        </View>
      </View>
    );
  }

  const handleConfirm = async () => {
    if (!user) return;

    if (method === 'card') {
      if (cardNumber.replace(/\s/g, '').length !== 16) {
        Alert.alert('Tarjeta inválida', 'El número debe tener 16 dígitos.');
        return;
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
        Alert.alert('Fecha inválida', 'Usa el formato MM/AA.');
        return;
      }
      if (!/^\d{3,4}$/.test(cvv)) {
        Alert.alert('CVV inválido', 'Debe tener 3 o 4 dígitos.');
        return;
      }
    }

    try {
      setProcessing(true);
      // Pago simulado: espera un momento como si hablara con un banco.
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Solo se guarda el método de pago: los datos de la tarjeta nunca salen de esta pantalla.
      const orderId = await createOrder({
        userId: user.uid,
        branchId: branch.id,
        items: items.map(
          ({ productId, name, quantity, unitPrice, selectedOptions, lineTotal }) => ({
            productId,
            name,
            quantity,
            unitPrice,
            selectedOptions,
            lineTotal,
          }),
        ),
        subtotal,
        discount,
        couponCode: coupon?.code,
        total,
        paymentMethod: method,
      });

      await scheduleOrderNotifications(orderId);

      router.replace('/orders');
      clear();
      Alert.alert(
        '¡Pedido confirmado!',
        method === 'cash'
          ? `Paga ${formatPrice(total)} al recoger en ${branch.name}.`
          : 'Tu pago fue aprobado (simulado).',
      );
    } catch (e) {
      Alert.alert('No se pudo crear el pedido', getAuthErrorMessage(e));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Sucursal */}
        <Text style={styles.section}>Recoger en</Text>
        <View style={styles.box}>
          <Ionicons name="storefront-outline" size={22} color={colors.primary} />
          <Text style={styles.boxValue}>{branch.name}</Text>
        </View>

        {/* Productos */}
        <Text style={styles.section}>Tu pedido</Text>
        <View style={styles.boxColumn}>
          {items.map((item) => (
            <View key={item.key} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>
                  {item.quantity} × {item.name}
                </Text>
                {item.selectedOptions.length > 0 && (
                  <Text style={styles.itemOptions}>
                    {item.selectedOptions.map((o) => o.label).join(' · ')}
                  </Text>
                )}
              </View>
              <Text style={styles.itemPrice}>{formatPrice(item.lineTotal)}</Text>
            </View>
          ))}
        </View>

        {/* Pago */}
        <Text style={styles.section}>Método de pago</Text>
        <View style={styles.methods}>
          {(['cash', 'card'] as PaymentMethod[]).map((m) => {
            const active = method === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMethod(m)}
                style={[styles.method, active && styles.methodActive]}
              >
                <Ionicons
                  name={m === 'cash' ? 'cash-outline' : 'card-outline'}
                  size={24}
                  color={active ? colors.primary : colors.muted}
                />
                <Text style={[styles.methodText, active && { color: colors.primary }]}>
                  {m === 'cash' ? 'Efectivo' : 'Tarjeta'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {method === 'card' && (
          <View style={styles.boxColumn}>
            <Text style={styles.simNote}>Pago simulado: no uses datos reales.</Text>
            <TextInput
              value={cardNumber}
              onChangeText={(v) => setCardNumber(formatCardNumber(v))}
              placeholder="Número de tarjeta"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              style={styles.input}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                value={expiry}
                onChangeText={(v) => setExpiry(formatExpiry(v))}
                placeholder="MM/AA"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                style={[styles.input, { flex: 1 }]}
              />
              <TextInput
                value={cvv}
                onChangeText={(v) => setCvv(v.replace(/\D/g, '').slice(0, 4))}
                placeholder="CVV"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                secureTextEntry
                style={[styles.input, { flex: 1 }]}
              />
            </View>
          </View>
        )}

        {method === 'cash' && (
          <Text style={styles.muted}>Pagarás en la sucursal al recoger tu pedido.</Text>
        )}

        {/* Totales */}
        <View style={[styles.boxColumn, { marginTop: 20 }]}>
          <View style={styles.totalRow}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text style={styles.totalSmall}>{formatPrice(subtotal)}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.muted}>Cupón {coupon?.code}</Text>
              <Text style={[styles.totalSmall, { color: '#2E7D32' }]}>
                −{formatPrice(discount)}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <PrimaryButton
            title={`Confirmar pedido · ${formatPrice(total)}`}
            onPress={handleConfirm}
            loading={processing}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, marginTop: 6 },
  section: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 18,
    marginBottom: 8,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  boxValue: { fontSize: 15, fontWeight: '600', color: colors.text },
  boxColumn: { padding: 14, gap: 10, borderRadius: 12, backgroundColor: '#FFFFFF' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  itemName: { fontSize: 15, fontWeight: '600', color: colors.text },
  itemOptions: { fontSize: 12, color: colors.muted, marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: '600', color: colors.text },
  methods: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  method: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  methodActive: { borderColor: colors.primary, backgroundColor: colors.blueSoft },
  methodText: { fontSize: 15, fontWeight: '600', color: colors.muted },
  simNote: { fontSize: 12, color: '#B3261E' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalSmall: { fontSize: 15, color: colors.text },
  totalLabel: { fontSize: 17, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 22, fontWeight: '700', color: colors.text },
});