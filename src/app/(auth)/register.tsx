import { Link } from 'expo-router';
import { useState } from 'react';
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
import { getAuthErrorMessage, registerUser } from '../../services/authService';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Faltan datos', 'Nombre, correo y contraseña son obligatorios.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña débil', 'Debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Las contraseñas no coinciden', 'Verifícalas e intenta de nuevo.');
      return;
    }
    try {
      setLoading(true);
      await registerUser({ name, email, password, phone });
      // El guard de _layout.tsx redirige a /menu automáticamente.
    } catch (e) {
      Alert.alert('No se pudo registrar', getAuthErrorMessage(e));
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
        <Text style={styles.title}>Crear cuenta</Text>

        <FormInput
          label="Nombre"
          value={name}
          onChangeText={setName}
          placeholder="Tu nombre"
          autoCapitalize="words"
        />
        <FormInput
          label="Teléfono (opcional)"
          value={phone}
          onChangeText={setPhone}
          placeholder="6531234567"
          keyboardType="phone-pad"
        />
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
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
          autoCapitalize="none"
        />
        <FormInput
          label="Confirmar contraseña"
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Repite la contraseña"
          secureTextEntry
          autoCapitalize="none"
        />

        <PrimaryButton title="Registrarme" onPress={handleRegister} loading={loading} />

        <View style={styles.footer}>
          <Text style={{ color: colors.muted }}>¿Ya tienes cuenta? </Text>
          <Link href="/login" style={styles.link}>
            Inicia sesión
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  link: { color: colors.primary, fontWeight: '600' },
});