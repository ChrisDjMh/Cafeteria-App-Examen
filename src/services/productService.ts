import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

import { db } from '../config/firebase';
import type { Product } from '../types/models';

export async function getProducts(): Promise<Product[]> {
  const snap = await getDocs(collection(db, 'products'));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }))
    .filter((p) => p.available)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getProductById(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, 'products', id));
  return snap.exists()
    ? { id: snap.id, ...(snap.data() as Omit<Product, 'id'>) }
    : null;
}