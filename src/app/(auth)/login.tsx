import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import { colors } from '../../config/theme';
import {
    getAuthErrorMessage,
    loginUser,
    setBiometricEnabled,
} from '../../services/authService';
import {
    authenticateWithBiometrics,
    getBiometricCredentials,
    isBiometricAvailable,
    saveBiometricCredentials,
} from '../../services/biometricService';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [bioReady, setBioReady] = useState(false);

  // Muestra el botón de huella solo si hay sensor y credenciales guardadas.
  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable();
      const saved = await getBiometricCredentials();
      setBioReady(available && !!saved);
    })();
  }, []);

  /** Tras un login manual, ofrece activar la huella para la próxima vez. */
  const offerBiometric = async (uid: string, mail: string, pass: string) => {
    try {
      if (!(await isBiometricAvailable())) return;
      const saved = await getBiometricCredentials();
      if (saved && saved.email === mail.trim().toLowerCase()) return;

      Alert.alert('Acceso rápido', '¿Quieres entrar con tu huella la próxima vez?', [
        { text: 'Ahora no', style: 'cancel' },
        {
          text: 'Activar',
          onPress: async () => {
            try {
              const ok = await authenticateWithBiometrics(
                'Confirma para activar el acceso con huella',
              );
              if (!ok) return;
              await saveBiometricCredentials(mail, pass);
              await setBiometricEnabled(uid, true);
            } catch {
              Alert.alert('Error', 'No se pudo activar la huella.');
            }
          },
        },
      ]);
    } catch {
      // Si falla la oferta, no interrumpimos el login.
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Faltan datos', 'Ingresa tu correo y contraseña.');
      return;
    }
    try {
      setLoading(true);
      const user = await loginUser(email, password);
      // El guard de _layout.tsx redirige a /menu automáticamente.
      offerBiometric(user.uid, email, password);
    } catch (e) {
      Alert.alert('No se pudo iniciar sesión', getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const ok = await authenticateWithBiometrics('Inicia sesión en BeanCraft');
      if (!ok) return;
      const creds = await getBiometricCredentials();
      if (!creds) {
        setBioReady(false);
        return;
      }
      setLoading(true);
      await loginUser(creds.email, creds.password);
    } catch (e) {
      Alert.alert('No se pudo iniciar sesión', getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>☕ BeanCraft Coffee</Text>
        <Text style={styles.subtitle}>Inicia sesión para pedir tu café</Text>

        <FormInput
          label="Correo"
          value={email}
          onChangeText={setEmail}
          placeholder="correo@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <FormInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
        />

        <PrimaryButton title="Iniciar sesión" onPress={handleLogin} loading={loading} />

        {bioReady && (
          <View style={styles.bioWrapper}>
            <View style={styles.bioIcon}>
              <Ionicons name="finger-print" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title="Entrar con huella"
                variant="outline"
                onPress={handleBiometricLogin}
                loading={loading}
              />
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={{ color: colors.muted }}>¿No tienes cuenta? </Text>
          <Link href="/register" style={styles.link}>
            Regístrate
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 6,
    marginBottom: 32,
  },
  bioWrapper: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  bioIcon: { width: 28, alignItems: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  link: { color: colors.primary, fontWeight: '600' },
});