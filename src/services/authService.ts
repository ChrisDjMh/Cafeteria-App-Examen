import { FirebaseError } from 'firebase/app';
import {
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { auth, db } from '../config/firebase';
import type { UserProfile } from '../types/models';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

/** Crea users/{uid} si todavía no existe (repara cuentas a medias). */
export async function ensureUserProfile(user: User, extra?: { name?: string; phone?: string }) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  await setDoc(ref, {
    name: extra?.name?.trim() || user.displayName || 'Usuario',
    email: (user.email ?? '').toLowerCase(),
    phone: extra?.phone?.trim() ?? '',
    biometricEnabled: false,
    createdAt: serverTimestamp(),
  });
}

export async function registerUser({ name, email, password, phone }: RegisterData) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(cred.user, { displayName: name.trim() });
  await ensureUserProfile(cred.user, { name, phone });
  return cred.user;
}

export async function loginUser(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  try {
    await ensureUserProfile(cred.user);
  } catch (e) {
    // No bloqueamos el login si Firestore falla; solo lo registramos.
    console.warn('No se pudo asegurar el perfil en Firestore:', e);
  }
  return cred.user;
}

export function logoutUser() {
  return signOut(auth);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export function setBiometricEnabled(uid: string, enabled: boolean) {
  return updateDoc(doc(db, 'users', uid), { biometricEnabled: enabled });
}

/** Traduce los códigos de error de Firebase a mensajes para el usuario. */
export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Correo o contraseña incorrectos.';
      case 'auth/email-already-in-use':
        return 'Ese correo ya está registrado. Prueba iniciar sesión.';
      case 'auth/invalid-email':
        return 'El correo no es válido.';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres.';
      case 'auth/network-request-failed':
        return 'Sin conexión. Revisa tu internet.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Espera un momento.';
      case 'auth/operation-not-allowed':
        return 'Falta activar Email/Password en Firebase Authentication.';
      case 'permission-denied':
        return 'Firestore rechazó la operación. Revisa las reglas de la base de datos.';
    }
    // Mientras desarrollamos mostramos el código para poder diagnosticar.
    return `Error de Firebase: ${error.code}`;
  }
  console.error(error);
  return `Error inesperado: ${error instanceof Error ? error.message : String(error)}`;
}