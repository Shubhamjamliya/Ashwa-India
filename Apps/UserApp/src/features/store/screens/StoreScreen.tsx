import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowLeft, ShoppingBag, ShoppingCart } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getMediaUrl } from '../../../services/media';
import { useCart } from '../../../context/CartContext';
import type { Product, ProductCategory } from '../types';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Store'>;
type Rt = RouteProp<HomeStackParamList, 'Store'>;

export function StoreScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { totalCount: cartCount } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | undefined>(params?.categoryId);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        apiFetch<{ products: Product[] }>('/store/products'),
        apiFetch<{ categories: ProductCategory[] }>('/store/categories'),
      ]);
      setProducts(productsRes.products);
      setCategories(categoriesRes.categories.filter((c: any) => c.status !== 'inactive'));
    } catch (e: any) {
      setError(e.message || 'Failed to load store');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filteredProducts = activeCategory
    ? products.filter(p => p.category?._id === activeCategory)
    : products;

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft color={colors.foreground} size={20} />
        </Pressable>
        <Text style={styles.title}>Accessories Store</Text>
        <Pressable
          onPress={() => navigation.navigate('Cart', undefined)}
          hitSlop={12}
          style={styles.cartBtn}>
          <ShoppingCart color={colors.foreground} size={20} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {categories.length > 0 && (
        <FlatList
          data={categories}
          keyExtractor={item => item._id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipListContainer}
          contentContainerStyle={styles.chipList}
          ListHeaderComponent={
            <Pressable
              style={[styles.chip, !activeCategory && styles.chipActive]}
              android_ripple={{ color: colors.border, borderless: false }}
              onPress={() => setActiveCategory(undefined)}>
              <Text style={[styles.chipText, !activeCategory && styles.chipTextActive]}>All</Text>
            </Pressable>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.chip, activeCategory === item._id && styles.chipActive]}
              android_ripple={{ color: colors.border, borderless: false }}
              onPress={() => setActiveCategory(item._id)}>
              <Text style={[styles.chipText, activeCategory === item._id && styles.chipTextActive]}>
                {item.name}
              </Text>
            </Pressable>
          )}
        />
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <ShoppingBag color={colors.mutedForeground} size={28} />
              <Text style={styles.emptyText}>No products in this category yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}>
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
              {item.stock <= 0 && <Text style={styles.outOfStock}>Out of stock</Text>}
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  cartBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cartBadge: {
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
  cartBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.white,
  },
  chipListContainer: {
    flexGrow: 0,
    flexShrink: 0,
    height: 52,
  },
  chipList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  chipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
  },
  chipTextActive: {
    color: colors.white,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 14,
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: 14,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  row: {
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
  },
  imageWrap: {
    width: '100%',
    height: 130,
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
  outOfStock: {
    fontSize: 11,
    color: colors.destructive,
    marginTop: 2,
    paddingHorizontal: spacing.sm,
  },
});
