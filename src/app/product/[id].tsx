import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import OptionGroupSelector from '../../components/OptionGroupSelector';
import PrimaryButton from '../../components/PrimaryButton';
import { categoryEmoji } from '../../config/categories';
import { colors } from '../../config/theme';
import { getAuthErrorMessage } from '../../services/authService';
import { getProductById } from '../../services/productService';
import { useCartStore } from '../../store/cartStore';
import type { OptionGroup, Product, SelectedOption } from '../../types/models';
import { formatPrice } from '../../utils/format';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let active = true;
    getProductById(id)
      .then((p) => {
        if (!active) return;
        setProduct(p);
        if (p) {
          // Los grupos requeridos de una sola opción arrancan con la primera elegida.
          const defaults: Record<string, string[]> = {};
          p.optionGroups.forEach((g) => {
            if (g.required && !g.multiple && g.options.length > 0) {
              defaults[g.id] = [g.options[0].id];
            }
          });
          setSelected(defaults);
        }
      })
      .catch((e) => Alert.alert('No se pudo cargar el producto', getAuthErrorMessage(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const selectedOptions: SelectedOption[] = useMemo(() => {
    if (!product) return [];
    return product.optionGroups.flatMap((g) =>
      (selected[g.id] ?? []).flatMap((optionId) => {
        const option = g.options.find((o) => o.id === optionId);
        return option
          ? [
              {
                groupId: g.id,
                optionId: option.id,
                label: option.label,
                priceDelta: option.priceDelta,
              },
            ]
          : [];
      }),
    );
  }, [product, selected]);

  const unitPrice = product
    ? product.basePrice + selectedOptions.reduce((sum, o) => sum + o.priceDelta, 0)
    : 0;

  const handleSelect = (group: OptionGroup, optionId: string) => {
    setSelected((prev) => {
      const current = prev[group.id] ?? [];

      if (group.multiple) {
        return {
          ...prev,
          [group.id]: current.includes(optionId)
            ? current.filter((x) => x !== optionId)
            : [...current, optionId],
        };
      }
      // Opcional de una sola opción: tocar la elegida la deselecciona.
      if (current.includes(optionId) && !group.required) {
        return { ...prev, [group.id]: [] };
      }
      return { ...prev, [group.id]: [optionId] };
    });
  };

  const handleAdd = () => {
    if (!product) return;

    const missing = product.optionGroups.find(
      (g) => g.required && (selected[g.id] ?? []).length === 0,
    );
    if (missing) {
      Alert.alert('Falta una opción', `Elige: ${missing.label}`);
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      category: product.category,
      imageUrl: product.imageUrl,
      quantity,
      unitPrice,
      selectedOptions,
    });

    Alert.alert('Agregado al carrito', `${quantity} × ${product.name}`, [
      { text: 'Seguir pidiendo', onPress: () => router.back() },
      { text: 'Ir al carrito', onPress: () => router.replace('/cart') },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.name}>Producto no encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: product.name }} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.hero} />
        ) : (
          <View style={[styles.hero, styles.heroPlaceholder]}>
            <Text style={{ fontSize: 64 }}>{categoryEmoji(product.category)}</Text>
          </View>
        )}

        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.desc}>{product.description}</Text>
        <Text style={styles.base}>Desde {formatPrice(product.basePrice)}</Text>

        <View style={{ height: 16 }} />

        {product.optionGroups.map((group) => (
          <OptionGroupSelector
            key={group.id}
            group={group}
            selectedIds={selected[group.id] ?? []}
            onSelect={(optionId) => handleSelect(group, optionId)}
          />
        ))}
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepBtn}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <Text style={styles.qty}>{quantity}</Text>
          <Pressable style={styles.stepBtn} onPress={() => setQuantity((q) => q + 1)}>
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1 }}>
          <PrimaryButton
            title={`Agregar · ${formatPrice(unitPrice * quantity)}`}
            onPress={handleAdd}
          />
        </View>
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
    backgroundColor: colors.background,
  },
  hero: { width: '100%', height: 200, borderRadius: 14, marginBottom: 16 },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blueSoft	,
  },
  name: { fontSize: 24, fontWeight: '700', color: colors.text },
  desc: { fontSize: 15, color: colors.muted, marginTop: 6 },
  base: { fontSize: 15, fontWeight: '600', color: colors.primary, marginTop: 8 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blueSoft	,
  },
  stepText: { fontSize: 20, fontWeight: '600', color: colors.primary },
  qty: { minWidth: 28, textAlign: 'center', fontSize: 17, fontWeight: '700' },
});