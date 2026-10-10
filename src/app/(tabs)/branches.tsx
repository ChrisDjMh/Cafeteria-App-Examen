import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import PrimaryButton from '../../components/PrimaryButton';
import { colors } from '../../config/theme';
import { getAuthErrorMessage } from '../../services/authService';
import { getBranches, relocateBranches } from '../../services/branchService';
import {
  Coords,
  distanceKm,
  formatDistance,
  getCurrentCoords,
} from '../../services/locationService';
import { useCartStore } from '../../store/cartStore';
import type { Branch } from '../../types/models';

type LocError = 'denied' | 'unavailable' | null;
type BranchWithDistance = Branch & { distance?: number };

export default function BranchesScreen() {
  const selectedBranch = useCartStore((s) => s.selectedBranch);
  const setBranch = useCartStore((s) => s.setBranch);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locError, setLocError] = useState<LocError>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setBranches(await getBranches());
    } catch (e) {
      Alert.alert('No se pudieron cargar las sucursales', getAuthErrorMessage(e));
    }

    try {
      setCoords(await getCurrentCoords());
      setLocError(null);
    } catch (e) {
      setCoords(null);
      setLocError(e instanceof Error && e.message === 'PERMISSION_DENIED' ? 'denied' : 'unavailable');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Con ubicación, ordena de la más cercana a la más lejana.
  const sorted: BranchWithDistance[] = useMemo(() => {
    if (!coords) return branches;
    return branches
      .map((b) => ({
        ...b,
        distance: distanceKm(coords, { latitude: b.lat, longitude: b.lng }),
      }))
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }, [branches, coords]);

  // Si el usuario aún no eligió sucursal, selecciona la más cercana automáticamente.
  useEffect(() => {
    if (coords && sorted.length > 0 && !selectedBranch) {
      setBranch({ id: sorted[0].id, name: sorted[0].name });
    }
  }, [coords, sorted, selectedBranch, setBranch]);

  const handleRelocate = () => {
    if (!coords) return;
    Alert.alert(
      'Herramienta de demo',
      'Esto mueve las 3 sucursales de ejemplo para que queden cerca de tu ubicación actual. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Mover',
          onPress: async () => {
            try {
              await relocateBranches(coords);
              await load();
            } catch (e) {
              Alert.alert('No se pudo actualizar', getAuthErrorMessage(e));
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>Buscando tu ubicación…</Text>
      </View>
    );
  }

  const nearest = coords && sorted.length > 0 ? sorted[0] : null;

  return (
    <View style={styles.container}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
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
        ListHeaderComponent={
          <View style={{ marginBottom: 12 }}>
            {locError && (
              <View style={styles.banner}>
                <Text style={styles.bannerTitle}>
                  {locError === 'denied'
                    ? 'Necesitamos tu ubicación'
                    : 'No pudimos obtener tu ubicación'}
                </Text>
                <Text style={styles.bannerText}>
                  {locError === 'denied'
                    ? 'Activa el permiso para encontrar la sucursal más cercana, o elige una manualmente.'
                    : 'Revisa que el GPS esté encendido e inténtalo de nuevo.'}
                </Text>
                <PrimaryButton title="Reintentar" onPress={load} />
                {locError === 'denied' && (
                  <PrimaryButton
                    title="Abrir ajustes"
                    variant="outline"
                    onPress={() => Linking.openSettings()}
                  />
                )}
              </View>
            )}

            {nearest && (
              <View style={styles.nearest}>
                <Ionicons name="navigate" size={20} color={colors.primary} />
                <Text style={styles.nearestText}>
                  Más cercana: {nearest.name} ({formatDistance(nearest.distance ?? 0)})
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <Text style={[styles.muted, { textAlign: 'center' }]}>
            No hay sucursales. Carga los datos de prueba desde el Menú.
          </Text>
        }
        ListFooterComponent={
          coords ? (
            <Pressable onPress={handleRelocate} style={{ padding: 12 }}>
              <Text style={styles.devLink}>Demo: mover sucursales cerca de mí</Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item, index }) => {
          const chosen = selectedBranch?.id === item.id;
          return (
            <Pressable
              onPress={() => setBranch({ id: item.id, name: item.name })}
              style={[styles.card, chosen && styles.cardChosen]}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.name}>{item.name}</Text>
                  {coords && index === 0 && <Text style={styles.badge}>Más cercana</Text>}
                </View>
                <Text style={styles.detail}>{item.address}</Text>
                <Text style={styles.detail}>🕒 {item.openHours}  ·  📞 {item.phone}</Text>
                {item.distance !== undefined && (
                  <Text style={styles.distance}>
                    A {formatDistance(item.distance)} de ti
                  </Text>
                )}
              </View>
              <Ionicons
                name={chosen ? 'checkmark-circle' : 'ellipse-outline'}
                size={26}
                color={chosen ? colors.primary : colors.muted}
              />
            </Pressable>
          );
        }}
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
    gap: 12,
    backgroundColor: colors.background,
  },
  muted: { color: colors.muted },
  banner: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.blueSoft,
    marginBottom: 12,
  },
  bannerTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  bannerText: { color: colors.muted, marginTop: 4, marginBottom: 8 },
  nearest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.blueSoft	,
  },
  nearestText: { flex: 1, color: colors.text, fontWeight: '600' },
  card: {
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
  cardChosen: { borderColor: colors.primary, backgroundColor: colors.blueSoft},
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  detail: { fontSize: 13, color: colors.muted, marginTop: 3 },
  distance: { fontSize: 14, fontWeight: '600', color: colors.primary, marginTop: 6 },
  devLink: { textAlign: 'center', color: colors.muted, textDecorationLine: 'underline' },
});