import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import PrimaryButton from '../../components/PrimaryButton';
import { categoryIcon } from '../../config/categories';
import { colors } from '../../config/theme';
import { getAuthErrorMessage } from '../../services/authService';
import { CouponError, validateCoupon } from '../../services/couponService';
import {
  selectDiscount,
  selectSubtotal,
  selectTotal,
  useCartStore,
} from '../../store/cartStore';
import { formatPrice } from '../../utils/format';

export default function CartScreen() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);
  const branch = useCartStore((s) => s.selectedBranch);
  const subtotal = useCartStore(selectSubtotal);
  const discount = useCartStore(selectDiscount);
  const total = useCartStore(selectTotal);
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const removeItem = useCartStore((s) => s.removeItem);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);

  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);

  const handleApply = async () => {
    try {
      setApplying(true);
      applyCoupon(await validateCoupon(code));
      setCode('');
    } catch (e) {
      Alert.alert(
        'Cupón no válido',
        e instanceof CouponError ? e.message : getAuthErrorMessage(e),
      );
    } finally {
      setApplying(false);
    }
  };

  const handleCheckout = () => {
    if (!branch) {
      Alert.alert('Elige una sucursal', 'Selecciona dónde recogerás tu pedido.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ver sucursales', onPress: () => router.push('/branches') },
      ]);
      return;
    }
    router.push('/checkout');
  };

  // Carrito vacío
  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIcon}>
          <Ionicons name="cart-outline" size={56} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
        <Text style={styles.emptyText}>Agrega algo rico del menú.</Text>
        <View style={{ width: '100%', marginTop: 16 }}>
          <PrimaryButton title="Ver menú" onPress={() => router.replace('/menu')} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Foto del producto; si no tiene, icono de su categoría */}
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.icon} />
            ) : (
              <View style={styles.icon}>
                <MaterialCommunityIcons
                  name={categoryIcon(item.category)}
                  size={28}
                  color={colors.primary}
                />
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              {item.selectedOptions.length > 0 && (
                <Text style={styles.options}>
                  {item.selectedOptions.map((o) => o.label).join(' · ')}
                </Text>
              )}
              <Text style={styles.unit}>{formatPrice(item.unitPrice)} c/u</Text>

              <View style={styles.stepper}>
                <Pressable style={styles.stepBtn} onPress={() => decrement(item.key)}>
                  <Text style={styles.stepText}>−</Text>
                </Pressable>
                <Text style={styles.qty}>{item.quantity}</Text>
                <Pressable style={styles.stepBtn} onPress={() => increment(item.key)}>
                  <Text style={styles.stepText}>+</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.right}>
              <Pressable onPress={() => removeItem(item.key)} hitSlop={10}>
                <Ionicons name="trash-outline" size={20} color={colors.muted} />
              </Pressable>
              <Text style={styles.lineTotal}>{formatPrice(item.lineTotal)}</Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View>
            {/* Sucursal */}
            <Pressable style={styles.box} onPress={() => router.push('/branches')}>
              <Ionicons name="storefront-outline" size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.boxLabel}>Sucursal de recolección</Text>
                <Text style={[styles.boxValue, !branch && { color: '#B3261E' }]}>
                  {branch ? branch.name : 'Elige una sucursal'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>

            {/* Cupón */}
            {coupon ? (
              <View style={[styles.box, { borderColor: colors.primary }]}>
                <Ionicons name="pricetag" size={22} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.boxLabel}>Cupón aplicado</Text>
                  <Text style={styles.boxValue}>
                    {coupon.code} · −{formatPrice(discount)}
                  </Text>
                </View>
                <Pressable onPress={removeCoupon} hitSlop={10}>
                  <Ionicons name="close-circle" size={24} color={colors.muted} />
                </Pressable>
              </View>
            ) : (
              <View style={styles.couponBox}>
                <Text style={styles.boxLabel}>¿Tienes un cupón?</Text>
                <View style={styles.couponRow}>
                  <TextInput
                    value={code}
                    onChangeText={setCode}
                    placeholder="Código"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    style={styles.couponInput}
                  />
                  <Pressable
                    style={[styles.couponBtn, applying && { opacity: 0.6 }]}
                    onPress={handleApply}
                    disabled={applying || !code.trim()}
                  >
                    <Text style={styles.couponBtnText}>Aplicar</Text>
                  </Pressable>
                </View>
                <Pressable style={styles.scanBtn} onPress={() => router.push('/scanner')}>
                  <Ionicons name="qr-code-outline" size={20} color={colors.primary} />
                  <Text style={styles.scanText}>Escanear código QR</Text>
                </Pressable>
              </View>
            )}
          </View>
        }
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalSmall}>{formatPrice(subtotal)}</Text>
        </View>
        {discount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Descuento</Text>
            <Text style={[styles.totalSmall, { color: '#2E7D32' }]}>
              −{formatPrice(discount)}
            </Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabelBig}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>
        <PrimaryButton title="Continuar al pago" onPress={handleCheckout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  emptyIcon: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blueSoft,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 16 },
  emptyText: { color: colors.muted, marginTop: 6 },

  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blueSoft,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  options: { fontSize: 12, color: colors.muted, marginTop: 2 },
  unit: { fontSize: 13, color: colors.muted, marginTop: 4 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blueSoft,
  },
  stepText: { fontSize: 18, fontWeight: '600', color: colors.primary },
  qty: { minWidth: 26, textAlign: 'center', fontSize: 15, fontWeight: '700' },
  right: { alignItems: 'flex-end', justifyContent: 'space-between' },
  lineTotal: { fontSize: 16, fontWeight: '700', color: colors.primary },

  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: '#FFFFFF',
  },
  boxLabel: { fontSize: 12, color: colors.muted },
  boxValue: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 2 },
  couponBox: {
    padding: 14,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  couponRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  couponBtn: {
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  couponBtnText: { color: '#FFFFFF', fontWeight: '600' },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  scanText: { color: colors.primary, fontWeight: '600' },

  footer: {
    padding: 16,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, color: colors.muted },
  totalSmall: { fontSize: 15, color: colors.text },
  totalLabelBig: { fontSize: 17, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 22, fontWeight: '700', color: colors.text },
});