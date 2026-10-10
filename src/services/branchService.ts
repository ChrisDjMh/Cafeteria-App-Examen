import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';

import { db } from '../config/firebase';
import type { Branch } from '../types/models';
import type { Coords } from './locationService';

export async function getBranches(): Promise<Branch[]> {
  const snap = await getDocs(collection(db, 'branches'));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Branch, 'id'>) }));
}

// Distancias relativas de las 3 sucursales respecto a un punto central.
const OFFSETS: Record<string, { dLat: number; dLng: number }> = {
  'branch-centro': { dLat: 0.0045, dLng: 0.003 },
  'branch-norte': { dLat: 0.018, dLng: -0.01 },
  'branch-universidad': { dLat: -0.045, dLng: 0.02 },
};

/** Herramienta de demo: reubica las 3 sucursales alrededor de unas coordenadas. */
export async function relocateBranches(center: Coords) {
  const batch = writeBatch(db);
  Object.entries(OFFSETS).forEach(([id, o]) => {
    batch.update(doc(db, 'branches', id), {
      lat: center.latitude + o.dLat,
      lng: center.longitude + o.dLng,
    });
  });
  await batch.commit();
}