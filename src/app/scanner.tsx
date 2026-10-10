import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../config/theme';
import { getAuthErrorMessage } from '../services/authService';
import { CouponError, validateCoupon } from '../services/couponService';
import { useCartStore } from '../store/cartStore';

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const lock = useRef(false); // evita procesar el mismo QR varias veces

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Necesitamos la cámara</Text>
        <Text style={styles.text}>
          Se usa solo para leer el código QR de tus cupones.
        </Text>
        <View style={{ width: '100%', marginTop: 16 }}>
          <PrimaryButton title="Permitir cámara" onPress={requestPermission} />
        </View>
      </View>
    );
  }

  const handleScan = async ({ data }: { data: string }) => {
    if (lock.current) return;
    lock.current = true;

    try {
      const coupon = await validateCoupon(data);
      applyCoupon(coupon);
      const label = coupon.type === 'percent' ? `${coupon.value}% de descuento` : `$${coupon.value} de descuento`;
      Alert.alert('¡Cupón aplicado!', `${coupon.code}: ${label}`, [
        { text: 'Listo', onPress: () => router.back() },
      ]);
    } catch (e) {
      const message = e instanceof CouponError ? e.message : getAuthErrorMessage(e);
      Alert.alert('No se pudo aplicar', message, [
        { text: 'Reintentar', onPress: () => (lock.current = false) },
        { text: 'Cancelar', style: 'cancel', onPress: () => router.back() },
      ]);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleScan}
      />

      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.frame} />
        <Text style={styles.hint}>Apunta al código QR del cupón</Text>
      </View>
    </View>
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
  text: { color: colors.muted, textAlign: 'center', marginTop: 8 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  frame: {
    width: 240,
    height: 240,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  hint: {
    marginTop: 20,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowRadius: 4,
  },
});