import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Heart, MapPin } from 'lucide-react-native';
import { colors, radius, spacing } from '../../../theme/colors';
import { getMediaUrl } from '../../../services/media';
import { useWishlist } from '../../../context/WishlistContext';
import type { Horse } from '../../marketplace/types';
import { priceLabel } from '../../marketplace/price';

const CARD_WIDTH = 170;
const NEW_WITHIN_MS = 7 * 24 * 60 * 60 * 1000;

type Props = {
  horses: Horse[];
  onViewAll: () => void;
  onPressHorse: (horseId: string) => void;
};

export function FeaturedHorses({ horses, onViewAll, onPressHorse }: Props) {
  const { isSaved, toggle } = useWishlist();
  if (!horses.length) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Featured Horses</Text>
        <Pressable onPress={onViewAll} hitSlop={8}>
          <Text style={styles.viewAll}>View All →</Text>
        </Pressable>
      </View>

      <FlatList
        data={horses.slice(0, 8)}
        keyExtractor={item => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isNew = Date.now() - new Date(item.createdAt).getTime() < NEW_WITHIN_MS;
          return (
            <Pressable style={styles.card} onPress={() => onPressHorse(item._id)}>
              <View style={styles.imageWrap}>
                {item.photos?.[0] ? (
                  <Image source={{ uri: getMediaUrl(item.photos[0]) }} style={styles.image} />
                ) : (
                  <View style={[styles.image, styles.imagePlaceholder]} />
                )}
                <View style={[styles.badge, isNew && styles.badgeNew]}>
                  <Text style={styles.badgeText}>{isNew ? 'NEW' : 'FOR SALE'}</Text>
                </View>
                <Pressable
                  style={styles.heartBtn}
                  hitSlop={8}
                  onPress={() => toggle(item)}>
                  <Heart
                    color={colors.white}
                    size={14}
                    fill={isSaved(item._id) ? colors.white : 'transparent'}
                  />
                </Pressable>
              </View>
              <Text style={styles.breed} numberOfLines={1}>
                {item.breed}
                {item.gender ? ` ${item.gender.charAt(0).toUpperCase()}${item.gender.slice(1)}` : ''}
              </Text>
              <View style={styles.metaRow}>
                {item.location ? (
                  <View style={styles.locationRow}>
                    <MapPin color={colors.mutedForeground} size={11} />
                    <Text style={styles.location} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>
                ) : (
                  <View />
                )}
                <View style={styles.priceBadge}>
                  <Text style={styles.price}>{priceLabel(item)}</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.foreground,
  },
  viewAll: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  list: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  card: {
    width: CARD_WIDTH,
    marginRight: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    paddingBottom: spacing.sm,
  },
  imageWrap: {
    width: '100%',
    height: 110,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: colors.muted,
  },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.navy,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeNew: {
    backgroundColor: colors.primary,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.3,
  },
  heartBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: 'rgba(15,34,56,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breed: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 1,
  },
  location: {
    fontSize: 11,
    color: colors.mutedForeground,
    flexShrink: 1,
  },
  priceBadge: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  price: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.accentForeground,
  },
});
