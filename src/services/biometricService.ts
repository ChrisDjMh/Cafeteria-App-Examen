import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const EMAIL_KEY = 'beancraft_bio_email';
const PASS_KEY = 'beancraft_bio_password';

/** El dispositivo tiene sensor y hay al menos una huella/rostro registrado. */
export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;
  return LocalAuthentication.isEnrolledAsync();
}

export async function authenticateWithBiometrics(
  reason = 'Confirma tu identidad',
): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    cancelLabel: 'Cancelar',
    fallbackLabel: 'Usar código',
  });
  return result.success;
}

export async function saveBiometricCredentials(email: string, password: string) {
  await SecureStore.setItemAsync(EMAIL_KEY, email.trim().toLowerCase());
  await SecureStore.setItemAsync(PASS_KEY, password);
}

export async function getBiometricCredentials(): Promise<{
  email: string;
  password: string;
} | null> {
  const email = await SecureStore.getItemAsync(EMAIL_KEY);
  const password = await SecureStore.getItemAsync(PASS_KEY);
  return email && password ? { email, password } : null;
}

export async function clearBiometricCredentials() {
  await SecureStore.deleteItemAsync(EMAIL_KEY);
  await SecureStore.deleteItemAsync(PASS_KEY);
}