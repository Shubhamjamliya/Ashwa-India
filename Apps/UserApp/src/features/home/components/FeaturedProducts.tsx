import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import { colors, radius, spacing } from '../../../theme/colors';
import { getMediaUrl } from '../../../services/media';
import type { Product } from '../../store/types';

const CARD_WIDTH = 150;

type Props = {
  products: Product[];
  onViewAll: () => void;
  onPressProduct: (productId: string) => void;
};

export function FeaturedProducts({ products, onViewAll, onPressProduct }: Props) {
  if (!products.length) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Featured Products</Text>
        <Pressable onPress={onViewAll} hitSlop={8}>
          <Text style={styles.viewAll}>View All →</Text>
        </Pressable>
      </View>

      <FlatList
        data={products.slice(0, 8)}
        keyExtractor={item => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => onPressProduct(item._id)}>
            <View style={styles.imageWrap}>
              {item.photos?.[0] ? (
                <Image source={{ uri: getMediaUrl(item.photos[0]) }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <ShoppingBag color={colors.mutedForeground} size={22} />
                </View>
              )}
            </View>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.price}>₹{item.price.toLocaleString('en-IN')}</Text>
          </Pressable>
        )}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    lineHeight: 17,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 4,
    paddingHorizontal: spacing.sm,
  },
});
