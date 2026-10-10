import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, setDoc } from 'firebase/firestore';
import { Alert, Platform } from 'react-native';

import { db } from '../config/firebase';

// Muestra la notificación también cuando la app está abierta.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// TEMPORAL: muestra el motivo del fallo en pantalla. Quitar cuando funcione.
const debug = (message: string) => Alert.alert('Diagnóstico de notificaciones', message);

/**
 * Pide permiso, obtiene el token nativo de FCM y lo guarda en users/{uid}.fcmToken.
 * Devuelve el token, o null si no se pudo.
 */
export async function registerForPushNotifications(uid: string): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      debug('Esto no es un dispositivo físico.');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Pedidos',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') {
      debug(`Permiso de notificaciones: ${status}. Actívalo en los ajustes del teléfono.`);
      return null;
    }

    // Token nativo de FCM (no el token de Expo): es el que acepta la consola de Firebase.
    const { data } = await Notifications.getDevicePushTokenAsync();
    const token = String(data);

    await setDoc(doc(db, 'users', uid), { fcmToken: token }, { merge: true });
    return token;
  } catch (e) {
    debug(`Error: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}