import React, { useEffect, useState } from 'react';
import { FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, ChevronDown, Search, ShoppingBag, SlidersHorizontal, Star } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { CartIconButton } from '../../../components/CartIconButton';
import { EmptyView, ErrorView, LoadingView } from '../../../components/StateViews';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getMediaUrl } from '../../../services/media';
import { useCart } from '../../../context/CartContext';
import { productStock, stockText } from '../stock';
import type { Product, ProductCategory } from '../types';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Store'>;
type Rt = RouteProp<HomeStackParamList, 'Store'>;

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
];

export function StoreScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { totalCount: cartCount } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState(params?.categoryId || '');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('newest');
  const [inStock, setInStock] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{ categories: ProductCategory[] }>('/store/categories', { auth: false })
      .then(d => setCategories((d.categories || []).filter(c => c.status !== 'inactive')))
      .catch(() => {});
  }, []);

  // Debounce typing so each keystroke doesn't hit the server.
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    setError('');
    const query = [`sort=${sort}`];
    if (activeCategory) query.push(`category=${activeCategory}`);
    if (q) query.push(`q=${encodeURIComponent(q)}`);
    if (inStock) query.push('inStock=1');
    if (minPrice) query.push(`minPrice=${minPrice}`);
    if (maxPrice) query.push(`maxPrice=${maxPrice}`);
    apiFetch<{ products: Product[] }>(`/store/products?${query.join('&')}`, { auth: false })
      .then(d => setProducts(d.products || []))
      .catch(e => setError(e.message || 'Failed to load products'))
      .finally(() => setLoading(false));
  }, [activeCategory, q, sort, inStock, minPrice, maxPrice]);

  const header = (
    <>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search color="#A3A3A3" size={16} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products"
            placeholderTextColor={colors.mutedForeground}
            style={styles.searchInput}
          />
        </View>
        <Pressable
          onPress={() => setShowFilters(v => !v)}
          style={[styles.filterBtn, showFilters && styles.filterBtnActive]}>
          <SlidersHorizontal color={showFilters ? colors.white : colors.foreground} size={16} />
        </Pressable>
      </View>

      {showFilters ? (
        <View style={styles.filters}>
          <View style={styles.priceRow}>
            <View style={styles.flex}>
              <Text style={styles.filterLabel}>Min price</Text>
              <TextInput
                value={minPrice}
                onChangeText={t => setMinPrice(t.replace(/\D/g, ''))}
                keyboardType="number-pad"
                placeholder="₹0"
                placeholderTextColor={colors.mutedForeground}
                style={styles.priceInput}
              />
            </View>
            <View style={styles.flex}>
              <Text style={styles.filterLabel}>Max price</Text>
              <TextInput
                value={maxPrice}
                onChangeText={t => setMaxPrice(t.replace(/\D/g, ''))}
                keyboardType="number-pad"
                placeholder="Any"
                placeholderTextColor={colors.mutedForeground}
                style={styles.priceInput}
              />
            </View>
          </View>
          <View style={styles.filterFoot}>
            <Pressable style={styles.checkRow} onPress={() => setInStock(v => !v)}>
              <View style={[styles.checkbox, inStock && styles.checkboxOn]}>
                {inStock ? <Check color={colors.white} size={12} strokeWidth={3} /> : null}
              </View>
              <Text style={styles.checkLabel}>In stock only</Text>
            </Pressable>
            <Pressable style={styles.sortBtn} onPress={() => setSortOpen(true)}>
              <Text style={styles.sortText}>{SORTS.find(s => s.value === sort)?.label}</Text>
              <ChevronDown color={colors.mutedForeground} size={14} />
            </Pressable>
          </View>
        </View>
      ) : null}

      {categories.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>SHOP BY CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {[{ _id: '', name: 'All' } as ProductCategory, ...categories].map(c => {
              const active = activeCategory === c._id;
              return (
                <Pressable
                  key={c._id || 'all'}
                  onPress={() => setActiveCategory(c._id)}
                  style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      ) : null}
    </>
  );

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader
        title="Accessories Store"
        right={<CartIconButton count={cartCount} onPress={() => navigation.navigate('Cart')} />}
      />

      <FlatList
        data={loading || error ? [] : products}
        keyExtractor={item => item._id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        ListEmptyComponent={
          loading ? (
            <LoadingView />
          ) : error ? (
            <ErrorView message={error} />
          ) : (
            <EmptyView
              icon={<ShoppingBag color="#A3A3A3" size={28} />}
              title="No products match your search."
            />
          )
        }
        renderItem={({ item }) => {
          const status = stockText(productStock(item));
          return (
            <Pressable style={styles.card} onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}>
              <View style={styles.imageWrap}>
                {item.photos?.[0] ? (
                  <Image source={{ uri: getMediaUrl(item.photos[0]) }} style={styles.fill} />
                ) : (
                  <ShoppingBag color="#A3A3A3" size={22} />
                )}
              </View>
              <Text style={styles.name} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.price}>
                ₹{item.price?.toLocaleString('en-IN')}
                {item.variants?.length ? <Text style={styles.options}> · options</Text> : null}
              </Text>
              <View style={styles.cardFoot}>
                <Text style={[styles.stock, { color: status.color }]}>{status.text}</Text>
                {item.ratingCount ? (
                  <View style={styles.rating}>
                    <Star color={colors.primary} fill={colors.primary} size={12} />
                    <Text style={styles.ratingText}>{(item.ratingAverage || 0).toFixed(1)}</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        }}
      />

      <Modal visible={sortOpen} transparent animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSortOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Sort by</Text>
            {SORTS.map(s => (
              <Pressable
                key={s.value}
                style={styles.sheetRow}
                onPress={() => {
                  setSort(s.value);
                  setSortOpen(false);
                }}>
                <Text style={[styles.sheetText, sort === s.value && styles.sheetTextActive]}>{s.label}</Text>
                {sort === s.value ? <Check color={colors.primary} size={16} /> : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1 },
  fill: { width: '100%', height: '100%' },
  list: { paddingBottom: spacing.lg },
  searchRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: 12 },
  searchBox: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.foreground, paddingVertical: 0 },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  filters: {
    gap: 12,
    marginHorizontal: spacing.md,
    marginTop: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 12,
  },
  priceRow: { flexDirection: 'row', gap: spacing.sm },
  filterLabel: { fontSize: 11, fontWeight: '600', color: colors.mutedForeground, marginBottom: 4 },
  priceInput: {
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 0,
    fontSize: 14,
    color: colors.foreground,
  },
  filterFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#A3A3A3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: '#D97706', borderColor: '#D97706' },
  checkLabel: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  sortBtn: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 8,
  },
  sortText: { fontSize: 12, color: colors.foreground },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.mutedForeground,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: spacing.sm,
  },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: 12 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.foreground },
  chipTextActive: { color: colors.white },
  gridRow: { gap: 12, paddingHorizontal: spacing.md },
  card: {
    flex: 1,
    marginBottom: 12,
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingBottom: 12,
  },
  imageWrap: { height: 130, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 13, fontWeight: '700', lineHeight: 17, color: colors.foreground, marginTop: spacing.sm, paddingHorizontal: 12 },
  price: { fontSize: 14, fontWeight: '800', color: colors.primary, marginTop: 4, paddingHorizontal: 12 },
  options: { fontSize: 10, fontWeight: '600', color: colors.mutedForeground },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, paddingHorizontal: 12 },
  stock: { fontSize: 11, fontWeight: '700' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 11, color: colors.mutedForeground },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.foreground, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sheetText: { fontSize: 14, color: colors.foreground },
  sheetTextActive: { fontWeight: '700', color: colors.primary },
});
