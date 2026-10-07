import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalendarDays } from 'lucide-react-native';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getMediaUrl } from '../../../services/media';

type TileKey = 'horses' | 'providers' | 'transport' | 'store' | 'events' | 'jobs';

// Tile order, colours and destinations are fixed in the app; images and labels come from the
// admin Explore section when set there, and a tile the admin switched off is hidden.
const TILES: { key: TileKey; label: string; image: number | null; bg: string }[] = [
  { key: 'horses', label: 'Horse\nMarketplace', image: require('../../../assets/horses-buy.png'), bg: '#FBEFD6' },
  { key: 'providers', label: 'Service\nProviders', image: require('../../../assets/service-providers.png'), bg: '#E1ECFC' },
  { key: 'transport', label: 'Horse\nTransport', image: require('../../../assets/transport.png'), bg: '#E0F4E7' },
  { key: 'store', label: 'Accessories\nStore', image: require('../../../assets/accessories.png'), bg: '#F0E4FB' },
  { key: 'events', label: 'Horse\nEvents', image: null, bg: '#FDE7E7' },
  { key: 'jobs', label: 'Horse\nJobs', image: null, bg: '#E8E6F9' },
];

type AdminTile = { key: string; label?: string; image?: string; active?: boolean };

export function QuickActionsList({ onPress }: { onPress: (key: TileKey) => void }) {
  const [adminTiles, setAdminTiles] = useState<Record<string, AdminTile>>({});

  useEffect(() => {
    apiFetch<{ items: AdminTile[] }>('/explore', { auth: false })
      .then(data => {
        const byKey: Record<string, AdminTile> = {};
        for (const item of data.items || []) byKey[item.key] = item;
        setAdminTiles(byKey);
      })
      .catch(() => setAdminTiles({}));
  }, []);

  return (
    <View style={styles.wrapper}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>Explore Ashwa India</Text>
        </View>
        <Text style={styles.viewAll}>View All →</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {TILES.map(tile => {
          const admin = adminTiles[tile.key];
          if (admin && admin.active === false) return null;
          const label = admin?.label ? admin.label.replace(/ /, '\n') : tile.label;
          const source = admin?.image ? { uri: getMediaUrl(admin.image) } : tile.image;
          return (
            <Pressable
              key={tile.key}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              onPress={() => onPress(tile.key)}>
              <View style={[styles.iconWrap, { backgroundColor: tile.bg }]}>
                {source ? (
                  <Image source={source} style={styles.iconImage} resizeMode="cover" />
                ) : (
                  <CalendarDays color="#B5474A" size={24} />
                )}
              </View>
              <Text style={styles.label} numberOfLines={2}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
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
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: 4,
  },
  item: {
    alignItems: 'center',
    width: 72,
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
