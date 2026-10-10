import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { ProductCategory } from '../types/models';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const CATEGORIES: {
  key: ProductCategory;
  label: string;
  emoji: string;
  icon: IconName;
}[] = [
  { key: 'coffee', label: 'Cafés', emoji: '☕', icon: 'coffee-outline' },
  { key: 'cold', label: 'Bebidas frías', emoji: '🧊', icon: 'cup-water' },
  { key: 'bakery', label: 'Repostería', emoji: '🥐', icon: 'cake' },
];

export const categoryEmoji = (key: ProductCategory) =>
  CATEGORIES.find((c) => c.key === key)?.emoji ?? '☕';


export const categoryIcon = (key: ProductCategory): IconName =>
  CATEGORIES.find((c) => c.key === key)?.icon ?? 'coffee-outline';