import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowUpRight, Heart, ShoppingBag, Stethoscope, Truck } from 'lucide-react-native';
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
};

export function QuickActionsList({ onHorsesPress, onStorePress }: Props) {
  const actions: Action[] = [
    {
      key: 'horses',
      label: 'Horse Marketplace',
      icon: Heart,
      iconBg: '#FBEFD6',
      iconColor: colors.primary,
      onPress: onHorsesPress,
    },
    {
      key: 'providers',
      label: 'Service Providers',
      icon: Stethoscope,
      iconBg: '#E1ECFC',
      iconColor: '#2563EB',
    },
    {
      key: 'transport',
      label: 'Horse Transport',
      icon: Truck,
      iconBg: '#E0F4E7',
      iconColor: '#16A34A',
    },
    {
      key: 'store',
      label: 'Accessories Store',
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

      <View style={styles.grid}>
        {actions.map(action => (
          <Pressable
            key={action.key}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            disabled={!action.onPress}
            onPress={action.onPress}>
            <View style={styles.cardTop}>
              <View style={[styles.iconWrap, { backgroundColor: action.iconBg }]}>
                <action.icon color={action.iconColor} size={23} strokeWidth={2.2} />
              </View>
              <View style={styles.arrowBadge}>
                <ArrowUpRight color={colors.mutedForeground} size={13} />
              </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  card: {
    width: '47%',
    aspectRatio: 1.05,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: 'space-between',
    shadowColor: '#0F2238',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBadge: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
    lineHeight: 18,
  },
});
