import * as Notifications from 'expo-notifications';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { auth } from '../config/firebase';
import { colors } from '../config/theme';
import { registerForPushNotifications } from '../services/notificationService';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const user = useAuthStore((s) => s.user);
  const initializing = useAuthStore((s) => s.initializing);
  const setUser = useAuthStore((s) => s.setUser);
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  // Escucha el estado de sesión de Firebase.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, [setUser]);

  // Redirige según haya sesión, pero solo cuando la navegación ya está montada.
  useEffect(() => {
    if (initializing || !navigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace('/menu');
    }
  }, [user, initializing, segments, navigationState?.key, router]);

  // Con sesión iniciada, registra el token de notificaciones del dispositivo.
  useEffect(() => {
    if (user) registerForPushNotifications(user.uid);
  }, [user]);

  // Al tocar una notificación, abre la pestaña de pedidos.
   const lastResponse = Notifications.useLastNotificationResponse();
  const handledId = useRef<string | null>(null);

  useEffect(() => {
    if (!lastResponse || !user || initializing || !navigationState?.key) return;
    if (lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const id = lastResponse.notification.request.identifier;
    if (handledId.current === id) return; // evita navegar dos veces por la misma
    handledId.current = id;

    router.navigate('/orders');
  }, [lastResponse, user, initializing, navigationState?.key, router]);

  return (
    <>
      <StatusBar style="dark" />

      <Stack
        screenOptions={{
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ title: 'Personalizar' }} />
        <Stack.Screen name="checkout" options={{ title: 'Resumen de pago' }} />
        <Stack.Screen
          name="scanner"
          options={{ title: 'Escanear cupón', presentation: 'modal' }}
        />
      </Stack>

      {/* Capa de carga: va encima del Stack en lugar de reemplazarlo. */}
      {initializing && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
