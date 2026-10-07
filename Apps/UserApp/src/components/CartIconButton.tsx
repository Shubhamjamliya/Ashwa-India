import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';
import { colors, radius } from '../theme/colors';

// White round cart button with a count badge, used on the navy store headers.
export function CartIconButton({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.btn}>
      <ShoppingCart color={colors.foreground} size={20} />
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

// White round button for a header icon (save, delete, ...).
export function HeaderIconButton({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.btn}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: radius.full,
    backgroundColor: colors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.white,
  },
});
