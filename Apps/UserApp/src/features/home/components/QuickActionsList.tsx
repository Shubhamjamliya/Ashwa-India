import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Heart, ShoppingBag, Stethoscope, Truck } from 'lucide-react-native';
import { colors, radius, spacing } from '../../../theme/colors';

type Action = {
  key: string;
  label: string;
  icon: typeof Heart;
  iconBg: string;
  iconColor: string;
  onPress?: () => void;
};

type Props = {
  onHorsesPress: () => void;
  onStorePress: () => void;
  onTransportPress: () => void;
};

export function QuickActionsList({ onHorsesPress, onStorePress, onTransportPress }: Props) {
  const actions: Action[] = [
    {
      key: 'horses',
      label: 'Horse\nMarketplace',
      icon: Heart,
      iconBg: '#FBEFD6',
      iconColor: colors.primary,
      onPress: onHorsesPress,
    },
    {
      key: 'providers',
      label: 'Service\nProviders',
      icon: Stethoscope,
      iconBg: '#E1ECFC',
      iconColor: '#2563EB',
    },
    {
      key: 'transport',
      label: 'Horse\nTransport',
      icon: Truck,
      iconBg: '#E0F4E7',
      iconColor: '#16A34A',
      onPress: onTransportPress,
    },
    {
      key: 'store',
      label: 'Accessories\nStore',
      icon: ShoppingBag,
      iconBg: '#F0E4FB',
      iconColor: '#7C3AED',
      onPress: onStorePress,
    },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionBar} />
        <Text style={styles.sectionTitle}>Explore Ashwa India</Text>
      </View>

      <View style={styles.row}>
        {actions.map(action => (
          <Pressable
            key={action.key}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            disabled={!action.onPress}
            onPress={action.onPress}>
            <View style={[styles.iconWrap, { backgroundColor: action.iconBg }]}>
              <action.icon color={action.iconColor} size={26} strokeWidth={2} />
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionBar: {
    width: 4,
    height: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.foreground,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  item: {
    alignItems: 'center',
    width: '23%',
  },
  itemPressed: {
    opacity: 0.6,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: spacing.xs,
    fontSize: 12,
    fontWeight: '600',
    color: colors.foreground,
    textAlign: 'center',
    lineHeight: 15,
  },
});
