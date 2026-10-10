import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../config/theme';
import { useOrderSimulation } from '../../services/orderSimulation';
import { useAuthStore } from '../../store/authStore';
import { selectCount, useCartStore } from '../../store/cartStore';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const tabs: { name: string; title: string; icon: IconName }[] = [
  { name: 'menu', title: 'Menú', icon: 'cafe-outline' },
  { name: 'cart', title: 'Carrito', icon: 'cart-outline' },
  { name: 'orders', title: 'Pedidos', icon: 'receipt-outline' },
  { name: 'branches', title: 'Sucursales', icon: 'storefront-outline' },
  { name: 'profile', title: 'Perfil', icon: 'person-outline' },
];

export default function TabsLayout() {
  const cartCount = useCartStore(selectCount);
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  useOrderSimulation(user?.uid);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Sin encabezado, deja espacio para la barra de estado en todas las pantallas.
        sceneStyle: { paddingTop: insets.top, backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: colors.border },
      }}
    >
      {tabs.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarBadge: t.name === 'cart' && cartCount > 0 ? cartCount : undefined,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={t.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}