import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import FadeInUp from '../../components/FadeInUp';
import PrimaryButton from '../../components/PrimaryButton';
import { CATEGORIES, categoryEmoji, type IconName } from '../../config/categories';
import { colors } from '../../config/theme';
import { getAuthErrorMessage } from '../../services/authService';
import { getProducts } from '../../services/productService';
import { seedDatabase } from '../../services/seedService';
import { useAuthStore } from '../../store/authStore';
import type { Product, ProductCategory } from '../../types/models';
import { formatPrice } from '../../utils/format';

type Filter = 'all' | ProductCategory;

// Color de cada categoría (tarjetas destacadas y recuadros).
const CATEGORY_COLORS: Record<ProductCategory, { bg: string; tile: string }> = {
  coffee: { bg: '#4A2C1D', tile: '#E6D5C3' }, // espresso / latte
  cold: { bg: '#7C9CC9', tile: '#D3E2F6' }, // azul chocolate
  bakery: { bg: '#B9894A', tile: '#F3E3C3' }, // caramelo dorado
};

// Recuadros de la fila de categorías (incluye "Todos").
const TILES: { key: Filter; label: string; icon: IconName; tile: string }[] = [
  { key: 'all', label: 'Todos', icon: 'view-grid-outline', tile: '#DCE6F3' },
  ...CATEGORIES.map((c) => ({
    key: c.key as Filter,
    label: c.label,
    icon: c.icon,
    tile: CATEGORY_COLORS[c.key].tile,
  })),
];

export default function MenuScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const firstName = (user?.displayName ?? '').split(' ')[0] || 'amigo';

  const load = useCallback(async () => {
    try {
      setProducts(await getProducts());
    } catch (e) {
      Alert.alert('No se pudo cargar el menú', getAuthErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await seedDatabase();
      await load();
    } catch (e) {
      Alert.alert('No se pudieron cargar los datos', getAuthErrorMessage(e));
    } finally {
      setSeeding(false);
    }
  };

  // Recomendados: los primeros 5 productos del catálogo.
  const featured = useMemo(() => products.slice(0, 5), [products]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (filter === 'all' || p.category === filter) &&
        (!q || p.name.toLowerCase().includes(q)),
    );
  }, [products, filter, query]);

  const openProduct = (id: string) =>
    router.push({ pathname: '/product/[id]', params: { id } });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Base de datos vacía: ofrece cargar los datos de prueba.
  if (products.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Aún no hay productos</Text>
        <Text style={styles.emptyText}>
          Carga el catálogo, las sucursales y los cupones de prueba en Firestore.
        </Text>
        <View style={{ width: '100%', marginTop: 16 }}>
          <PrimaryButton
            title="Cargar datos de prueba"
            onPress={handleSeed}
            loading={seeding}
          />
        </View>
      </View>
    );
  }

  const header = (
    <View>
      {/* Saludo + campana */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.hello}>Hola,</Text>
          <Text style={styles.userName}>{firstName}</Text>
        </View>
        <Pressable style={styles.bell} onPress={() => router.push('/orders')}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </Pressable>
      </View>

      {/* Buscador */}
      <View style={styles.search}>
        <Ionicons name="search-outline" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar café, bebida o postre"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {!!query && (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {/* Recomendados (se oculta al buscar) */}
      {!query.trim() && (
        <>
          <Text style={styles.sectionTitle}>Recomendados</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hList}
          >
            {featured.map((p, i) => (
              <FadeInUp key={p.id} delay={i * 100}>
                <Pressable
                  onPress={() => openProduct(p.id)}
                  style={({ pressed }) => [
                    styles.featCard,
                    { backgroundColor: CATEGORY_COLORS[p.category].bg },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  {p.imageUrl ? (
                    <Image source={{ uri: p.imageUrl }} style={styles.featImage} />
                  ) : (
                    <Text style={styles.featEmoji}>{categoryEmoji(p.category)}</Text>
                  )}
                  <View>
                    <Text style={styles.featName} numberOfLines={2}>
                      {p.name}
                    </Text>
                    <Text style={styles.featPrice}>{formatPrice(p.basePrice)}</Text>
                  </View>
                </Pressable>
              </FadeInUp>
            ))}
          </ScrollView>
        </>
      )}

      {/* Categorías */}
      <Text style={styles.sectionTitle}>Categorías</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hList}
      >
        {TILES.map((c) => {
          const active = filter === c.key;
          return (
            <Pressable key={c.key} onPress={() => setFilter(c.key)} style={styles.catItem}>
              <View
                style={[
                  styles.catTile,
                  { backgroundColor: c.tile },
                  active && styles.catTileActive,
                ]}
              >
                <MaterialCommunityIcons name={c.icon} size={30} color={colors.primary} />
              </View>
              <Text
                style={[
                  styles.catLabel,
                  active && { color: colors.primary, fontWeight: '700' },
                ]}
              >
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.sectionTitle}>
        {filter === 'all' ? 'Todo el menú' : CATEGORIES.find((c) => c.key === filter)?.label}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No se encontraron productos.</Text>
        }
        renderItem={({ item, index }) => (
          <FadeInUp delay={Math.min(index, 8) * 60}>
            <Pressable
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
              onPress={() => openProduct(item.id)}
            >
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Text style={{ fontSize: 34 }}>{categoryEmoji(item.category)}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.desc} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={styles.price}>{formatPrice(item.basePrice)}</Text>
              </View>
            </Pressable>
          </FadeInUp>
        )}
      />
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
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  emptyText: { textAlign: 'center', color: colors.muted, marginTop: 12 },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  hello: { fontSize: 24, color: colors.muted },
  userName: { fontSize: 28, fontWeight: '800', color: colors.text },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 18,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: 22,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  hList: { paddingHorizontal: 20, gap: 14 },

  featCard: {
    width: 230,
    height: 170,
    borderRadius: 24,
    padding: 18,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  featImage: {
    position: 'absolute',
    right: -20,
    top: -10,
    width: 150,
    height: 120,
    borderRadius: 60,
  },
  featEmoji: { position: 'absolute', right: 14, top: 12, fontSize: 64 },
  featName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', maxWidth: 160 },
  featPrice: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', marginTop: 4 },

  catItem: { alignItems: 'center', width: 76 },
  catTile: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  catTileActive: { borderColor: colors.primary },
  catLabel: { fontSize: 12, color: colors.text, marginTop: 6, textAlign: 'center' },

  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  thumb: { width: 84, height: 84, borderRadius: 12 },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blueSoft,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  desc: { fontSize: 13, color: colors.muted, marginTop: 2 },
  price: { fontSize: 16, fontWeight: '700', color: colors.primary, marginTop: 6 },
});