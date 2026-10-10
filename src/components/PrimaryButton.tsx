import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../config/theme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'outline';
}

export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  variant = 'primary',
}: Props) {
  const outline = variant === 'outline';
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.button,
        outline ? styles.outline : styles.filled,
        (pressed || loading) && { opacity: 0.7 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={outline ? colors.primary : '#FFFFFF'} />
      ) : (
        <Text style={[styles.text, outline && { color: colors.primary }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  filled: { backgroundColor: colors.primary },
  outline: { borderWidth: 1.5, borderColor: colors.primary },
  text: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});