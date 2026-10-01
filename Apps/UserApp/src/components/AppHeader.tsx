import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell, ChevronDown, MapPin, ShoppingCart } from 'lucide-react-native';
import { colors, radius, spacing } from '../theme/colors';

type Props = {
  address?: string;
  cartCount?: number;
  notificationCount?: number;
  onAddressPress?: () => void;
  onCartPress?: () => void;
  onBellPress?: () => void;
};

export function AppHeader({
  address = 'Select delivery location',
  cartCount = 0,
  notificationCount = 0,
  onAddressPress,
  onCartPress,
  onBellPress,
}: Props) {
  return (
    <View style={styles.row}>
      <Pressable style={styles.addressBtn} onPress={onAddressPress} hitSlop={8}>
        <MapPin color={colors.primary} size={18} />
        <Text style={styles.addressText} numberOfLines={1}>
          {address}
        </Text>
        <ChevronDown color={colors.navyMuted} size={16} />
      </Pressable>

      <View style={styles.actions}>
        <Pressable style={styles.iconBtn} onPress={onCartPress} hitSlop={8}>
          <ShoppingCart color={colors.navyForeground} size={20} />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
            </View>
          )}
        </Pressable>

        <Pressable style={styles.iconBtn} onPress={onBellPress} hitSlop={8}>
          <Bell color={colors.navyForeground} size={20} />
          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.navy,
  },
  addressBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: spacing.sm,
  },
  addressText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.navyForeground,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navyLight,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.navy,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.white,
  },
});
