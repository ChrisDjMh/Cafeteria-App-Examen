import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../config/theme';
import type { OptionGroup } from '../types/models';
import { formatPrice } from '../utils/format';

interface Props {
  group: OptionGroup;
  selectedIds: string[];
  onSelect: (optionId: string) => void;
}

export default function OptionGroupSelector({ group, selectedIds, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{group.label}</Text>
        <Text style={styles.tag}>
          {group.required ? 'Requerido' : group.multiple ? 'Elige varios' : 'Opcional'}
        </Text>
      </View>

      {group.options.map((option) => {
        const active = selectedIds.includes(option.id);
        const icon = group.multiple
          ? active
            ? 'checkbox'
            : 'square-outline'
          : active
            ? 'radio-button-on'
            : 'radio-button-off';

        return (
          <Pressable
            key={option.id}
            onPress={() => onSelect(option.id)}
            style={[styles.row, active && styles.rowActive]}
          >
            <Ionicons
              name={icon}
              size={22}
              color={active ? colors.primary : colors.muted}
            />
            <Text style={styles.label}>{option.label}</Text>
            {option.priceDelta > 0 && (
              <Text style={styles.delta}>+{formatPrice(option.priceDelta)}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  tag: { fontSize: 12, color: colors.muted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    marginBottom: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  rowActive: { borderColor: colors.primary, backgroundColor: colors.blueSoft },
  label: { flex: 1, fontSize: 15, color: colors.text },
  delta: { fontSize: 14, color: colors.muted },
});