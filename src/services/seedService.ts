import { Timestamp, doc, writeBatch } from 'firebase/firestore';

import { db } from '../config/firebase';
import type { Branch, Coupon, OptionGroup, Product } from '../types/models';

// Las 3 sucursales se generan alrededor de este punto.
// Cámbialo por las coordenadas del lugar donde harás la demo
// (en Google Maps: clic derecho sobre el mapa → copia las coordenadas),
// para que la "sucursal más cercana" tenga sentido.
const BASE_LAT = 19.4326;
const BASE_LNG = -99.1332;

const sizeGroup: OptionGroup = {
  id: 'size',
  label: 'Tamaño',
  required: true,
  multiple: false,
  options: [
    { id: 's', label: 'Chico', priceDelta: 0 },
    { id: 'm', label: 'Mediano', priceDelta: 10 },
    { id: 'l', label: 'Grande', priceDelta: 18 },
  ],
};

const milkGroup: OptionGroup = {
  id: 'milk',
  label: 'Tipo de leche',
  required: true,
  multiple: false,
  options: [
    { id: 'whole', label: 'Entera', priceDelta: 0 },
    { id: 'light', label: 'Deslactosada', priceDelta: 0 },
    { id: 'oat', label: 'Avena', priceDelta: 12 },
    { id: 'almond', label: 'Almendra', priceDelta: 12 },
  ],
};

const sweetenerGroup: OptionGroup = {
  id: 'sweetener',
  label: 'Endulzante',
  required: false,
  multiple: false,
  options: [
    { id: 'none', label: 'Sin endulzante', priceDelta: 0 },
    { id: 'sugar', label: 'Azúcar', priceDelta: 0 },
    { id: 'stevia', label: 'Stevia', priceDelta: 0 },
    { id: 'honey', label: 'Miel', priceDelta: 5 },
  ],
};

const extrasGroup: OptionGroup = {
  id: 'extras',
  label: 'Extras',
  required: false,
  multiple: true,
  options: [
    { id: 'shot', label: 'Shot extra de espresso', priceDelta: 15 },
    { id: 'cream', label: 'Crema batida', priceDelta: 8 },
    { id: 'caramel', label: 'Jarabe de caramelo', priceDelta: 8 },
  ],
};

// imageUrl vacío: la app muestra un emoji. Puedes pegar URLs de imágenes después.
const products: Product[] = [
  {
    id: 'espresso',
    name: 'Espresso',
    description: 'Shot intenso de café recién molido.',
    category: 'coffee',
    basePrice: 35,
    imageUrl: '',
    available: true,
    optionGroups: [sizeGroup, sweetenerGroup, extrasGroup],
  },
  {
    id: 'americano',
    name: 'Americano',
    description: 'Espresso alargado con agua caliente.',
    category: 'coffee',
    basePrice: 40,
    imageUrl: '',
    available: true,
    optionGroups: [sizeGroup, sweetenerGroup, extrasGroup],
  },
  {
    id: 'latte-vainilla',
    name: 'Latte Vainilla',
    description: 'Espresso con leche vaporizada y un toque de vainilla.',
    category: 'coffee',
    basePrice: 55,
    imageUrl: '',
    available: true,
    optionGroups: [sizeGroup, milkGroup, sweetenerGroup, extrasGroup],
  },
  {
    id: 'capuchino',
    name: 'Capuchino',
    description: 'Espresso, leche y una espuma cremosa.',
    category: 'coffee',
    basePrice: 50,
    imageUrl: '',
    available: true,
    optionGroups: [sizeGroup, milkGroup, sweetenerGroup, extrasGroup],
  },
  {
    id: 'cold-brew',
    name: 'Cold Brew',
    description: 'Café infusionado en frío durante 12 horas.',
    category: 'cold',
    basePrice: 58,
    imageUrl: '',
    available: true,
    optionGroups: [sizeGroup, sweetenerGroup, extrasGroup],
  },
  {
    id: 'frappe-moka',
    name: 'Frappé Moka',
    description: 'Café helado licuado con chocolate y crema batida.',
    category: 'cold',
    basePrice: 68,
    imageUrl: '',
    available: true,
    optionGroups: [sizeGroup, milkGroup, sweetenerGroup, extrasGroup],
  },
  {
    id: 'te-helado',
    name: 'Té Helado de Durazno',
    description: 'Té negro frío con sabor a durazno.',
    category: 'cold',
    basePrice: 45,
    imageUrl: '',
    available: true,
    optionGroups: [sizeGroup, sweetenerGroup],
  },
  {
    id: 'croissant',
    name: 'Croissant de Mantequilla',
    description: 'Hojaldrado y recién horneado.',
    category: 'bakery',
    basePrice: 38,
    imageUrl: '',
    available: true,
    optionGroups: [],
  },
  {
    id: 'muffin-arandano',
    name: 'Muffin de Arándano',
    description: 'Esponjoso, con arándanos naturales.',
    category: 'bakery',
    basePrice: 42,
    imageUrl: '',
    available: true,
    optionGroups: [],
  },
  {
    id: 'galleta-choco',
    name: 'Galleta con Chispas de Chocolate',
    description: 'Suave por dentro, crujiente por fuera.',
    category: 'bakery',
    basePrice: 30,
    imageUrl: '',
    available: true,
    optionGroups: [],
  },
];

const branches: Branch[] = [
  {
    id: 'branch-centro',
    name: 'BeanCraft Centro',
    address: 'Av. Principal 123, Centro',
    lat: BASE_LAT + 0.0045,
    lng: BASE_LNG + 0.003,
    phone: '5550001111',
    openHours: '7:00 - 21:00',
  },
  {
    id: 'branch-norte',
    name: 'BeanCraft Plaza Norte',
    address: 'Blvd. Norte 456, Plaza Norte',
    lat: BASE_LAT + 0.018,
    lng: BASE_LNG - 0.01,
    phone: '5550002222',
    openHours: '8:00 - 22:00',
  },
  {
    id: 'branch-universidad',
    name: 'BeanCraft Universidad',
    address: 'Calle Universidad 789, Col. Estudiantes',
    lat: BASE_LAT - 0.045,
    lng: BASE_LNG + 0.02,
    phone: '5550003333',
    openHours: '7:00 - 20:00',
  },
];

const coupons: Coupon[] = [
  {
    code: 'BEAN10',
    type: 'percent',
    value: 10,
    active: true,
    expiresAt: Timestamp.fromDate(new Date(2027, 0, 1)),
  },
  {
    code: 'CAFE20',
    type: 'fixed',
    value: 20,
    active: true,
    expiresAt: Timestamp.fromDate(new Date(2027, 0, 1)),
  },
];

/** Sube catálogo, sucursales y cupones. Es seguro ejecutarlo varias veces. */
export async function seedDatabase() {
  const batch = writeBatch(db);

  products.forEach(({ id, ...data }) => {
    batch.set(doc(db, 'products', id), data);
  });
  branches.forEach(({ id, ...data }) => {
    batch.set(doc(db, 'branches', id), data);
  });
  coupons.forEach(({ code, ...data }) => {
    batch.set(doc(db, 'coupons', code), { code, ...data });
  });

  await batch.commit();
  return {
    products: products.length,
    branches: branches.length,
    coupons: coupons.length,
  };
}