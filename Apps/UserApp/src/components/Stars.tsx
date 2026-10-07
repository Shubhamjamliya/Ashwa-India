import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { colors } from '../theme/colors';

const EMPTY_STAR = '#D4D4D4';

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map(n => {
        const filled = n <= Math.round(value);
        return (
          <Star
            key={n}
            size={size}
            color={filled ? colors.primary : EMPTY_STAR}
            fill={filled ? colors.primary : 'transparent'}
          />
        );
      })}
    </View>
  );
}

// Tappable 1–5 star picker used by the rating forms.
export function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={styles.pickerRow}>
      {[1, 2, 3, 4, 5].map(n => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={4}>
          <Star
            size={26}
            color={n <= value ? colors.primary : EMPTY_STAR}
            fill={n <= value ? colors.primary : 'transparent'}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 6,
  },
});
