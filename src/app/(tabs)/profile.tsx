import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import PrimaryButton from '../../components/PrimaryButton';
import { colors } from '../../config/theme';
import {
    getUserProfile,
    logoutUser,
    setBiometricEnabled,
} from '../../services/authService';
import {
    clearBiometricCredentials,
    getBiometricCredentials,
    isBiometricAvailable,
} from '../../services/biometricService';
import { useAuthStore } from '../../store/authStore';
import type { UserProfile } from '../../types/models';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioOn, setBioOn] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid)
      .then(setProfile)
      .catch(() => setProfile(null));

    (async () => {
      setBioAvailable(await isBiometricAvailable());
      const creds = await getBiometricCredentials();
      setBioOn(!!creds && creds.email === user.email?.toLowerCase());
    })();
  }, [user]);

  const handleToggleBio = (value: boolean) => {
    if (!user) return;
    if (value) {
      Alert.alert(
        'Activar huella',
        'Para activarla, cierra sesión e inicia con tu contraseña. Ahí te lo ofreceremos.',
      );
      return;
    }
    Alert.alert('Desactivar huella', '¿Quitar el acceso rápido con huella?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desactivar',
        style: 'destructive',
        onPress: async () => {
          await clearBiometricCredentials();
          await setBiometricEnabled(user.uid, false);
          setBioOn(false);
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => logoutUser() },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(profile?.name ?? user?.displayName ?? '?').charAt(0).toUpperCase()}
        </Text>
      </View>

      <Text style={styles.name}>{profile?.name ?? user?.displayName ?? 'Usuario'}</Text>
      <Text style={styles.detail}>{profile?.email ?? user?.email}</Text>
      {!!profile?.phone && <Text style={styles.detail}>{profile.phone}</Text>}

      {bioAvailable && (
        <View style={styles.row}>
          <Text style={styles.rowText}>Acceso con huella</Text>
          <Switch
            value={bioOn}
            onValueChange={handleToggleBio}
            trackColor={{ true: colors.primary }}
          />
        </View>
      )}

      <View style={{ width: '100%', marginTop: 32 }}>
        <PrimaryButton title="Cerrar sesión" variant="outline" onPress={handleLogout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
    backgroundColor: colors.background,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: { color: '#FFFFFF', fontSize: 36, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  detail: { fontSize: 15, color: colors.muted, marginTop: 4 },
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  rowText: { fontSize: 16, color: colors.text },
});