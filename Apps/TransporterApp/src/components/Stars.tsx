import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Star } from 'lucide-react-native';

const FILLED = '#FBBF24';
const EMPTY = '#D4D4D4';

// Read-only 1–5 stars (amber, like the web reviews page).
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map(n => {
        const on = n <= value;
        return <Star key={n} size={size} color={on ? FILLED : EMPTY} fill={on ? FILLED : 'transparent'} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
});
