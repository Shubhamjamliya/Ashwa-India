import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../../theme/colors';

type Action = {
  key: string;
  label: string;
  image: number;
  iconBg: string;
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
      image: require('../../../assets/horses-buy.png'),
      iconBg: '#FBEFD6',
      onPress: onHorsesPress,
    },
    {
      key: 'providers',
      label: 'Service\nProviders',
      image: require('../../../assets/service-providers.png'),
      iconBg: '#E1ECFC',
    },
    {
      key: 'transport',
      label: 'Horse\nTransport',
      image: require('../../../assets/transport.png'),
      iconBg: '#E0F4E7',
      onPress: onTransportPress,
    },
    {
      key: 'store',
      label: 'Accessories\nStore',
      image: require('../../../assets/accessories.png'),
      iconBg: '#F0E4FB',
      onPress: onStorePress,
    },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>Explore Ashwa India</Text>
        </View>
        <Text style={styles.viewAll}>View All →</Text>
      </View>

      <View style={styles.row}>
        {actions.map(action => (
          <Pressable
            key={action.key}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            disabled={!action.onPress}
            onPress={action.onPress}>
            <View style={[styles.iconWrap, { backgroundColor: action.iconBg }]}>
              <Image source={action.image} style={styles.iconImage} resizeMode="cover" />
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
    marginTop: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  viewAll: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
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
    overflow: 'hidden',
  },
  iconImage: {
    width: '100%',
    height: '100%',
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
