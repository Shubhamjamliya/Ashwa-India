import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { HeroSection } from '../components/HeroSection';
import { BannerCarousel } from '../components/BannerCarousel';
import { SearchFilterCard } from '../components/SearchFilterCard';
import { QuickActionsList } from '../components/QuickActionsList';
import { FeaturedHorses } from '../components/FeaturedHorses';
import { FeaturedProducts } from '../components/FeaturedProducts';
import { colors, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';
import { useNotifications } from '../../../context/NotificationContext';
import type { Banner } from '../types';
import type { Horse, HorseCategory } from '../../marketplace/types';
import type { Product } from '../../store/types';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { totalCount: cartCount } = useCart();
  const { horses: savedHorses } = useWishlist();
  const { unreadCount: notificationCount } = useNotifications();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<HorseCategory[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const loadData = useCallback(async () => {
    const [bannersRes, categoriesRes, horsesRes, productsRes] = await Promise.allSettled([
      apiFetch<{ banners: Banner[] }>('/banners', { auth: false }),
      apiFetch<{ categories: HorseCategory[] }>('/marketplace/categories'),
      apiFetch<{ horses: Horse[] }>('/marketplace/horses'),
      apiFetch<{ products: Product[] }>('/store/products'),
    ]);
    if (bannersRes.status === 'fulfilled') setBanners(bannersRes.value.banners);
    if (categoriesRes.status === 'fulfilled') setCategories(categoriesRes.value.categories);
    if (horsesRes.status === 'fulfilled') setHorses(horsesRes.value.horses);
    if (productsRes.status === 'fulfilled') setProducts(productsRes.value.products);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (filters: { categoryId?: string; location?: string }) => {
    navigation.navigate('HorseMarketplace', {
      category: filters.categoryId,
      location: filters.location,
    });
  };

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <HeroSection
          horsesCount={horses.length}
          cartCount={cartCount}
          wishlistCount={savedHorses.length}
          notificationCount={notificationCount}
          onBrowsePress={() => navigation.navigate('HorseMarketplace', undefined)}
          onCartPress={() => navigation.navigate('Cart', undefined)}
          onWishlistPress={() => navigation.navigate('Wishlist', undefined)}
          onBellPress={() => navigation.navigate('Notifications', undefined)}
          onChangeLocationPress={() => navigation.navigate('ChangeLocation')}
        />

        {banners.length > 0 ? <BannerCarousel banners={banners} /> : null}

        <QuickActionsList
          onHorsesPress={() => navigation.navigate('HorseMarketplace', undefined)}
          onStorePress={() => navigation.navigate('Store', undefined)}
          onTransportPress={() => navigation.navigate('TransportLocation')}
        />

        <FeaturedHorses
          horses={horses}
          onViewAll={() => navigation.navigate('HorseMarketplace', undefined)}
          onPressHorse={horseId => navigation.navigate('HorseDetail', { horseId })}
        />

        <FeaturedProducts
          products={products}
          onViewAll={() => navigation.navigate('Store', undefined)}
          onPressProduct={productId => navigation.navigate('ProductDetail', { productId })}
        />

        <SearchFilterCard categories={categories} onSearch={handleSearch} />

        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No active bookings</Text>
          <Text style={styles.emptyText}>
            Browse services, transport or the marketplace to get started.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: {
    padding: 0,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  emptyState: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 4,
    textAlign: 'center',
  },
});
