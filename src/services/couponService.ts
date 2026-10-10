import { doc, getDoc } from 'firebase/firestore';

import { db } from '../config/firebase';
import type { Coupon } from '../types/models';

export interface AppliedCoupon {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
}

export class CouponError extends Error {}

/** Valida un código (leído del QR o escrito a mano) contra la colección coupons. */
export async function validateCoupon(rawCode: string): Promise<AppliedCoupon> {
  const code = rawCode.trim().toUpperCase();
  if (!code) throw new CouponError('Ingresa un código.');
  // Evita rutas inválidas de Firestore si el QR trae una URL u otro texto.
  if (!/^[A-Z0-9_-]{1,30}$/.test(code)) throw new CouponError('Cupón no válido.');

  const snap = await getDoc(doc(db, 'coupons', code));
  if (!snap.exists()) throw new CouponError('Cupón no válido.');

  const data = snap.data() as Coupon;
  if (!data.active) throw new CouponError('Este cupón ya no está activo.');
  if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
    throw new CouponError('Este cupón ya expiró.');
  }

  return { code, type: data.type, value: data.value };
}