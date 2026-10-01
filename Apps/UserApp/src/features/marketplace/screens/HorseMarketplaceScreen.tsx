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
import { ArrowLeft, Heart, MapPin } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getMediaUrl } from '../../../services/media';
import { useWishlist } from '../../../context/WishlistContext';
import type { Horse } from '../types';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'HorseMarketplace'>;
type Rt = RouteProp<HomeStackParamList, 'HorseMarketplace'>;

export function HorseMarketplaceScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isSaved, toggle } = useWishlist();

  const load = useCallback(async () => {
    setError(null);
    try {
      const query = new URLSearchParams();
      if (params?.category) query.set('category', params.category);
      if (params?.location) query.set('location', params.location);
      const qs = query.toString();
      const data = await apiFetch<{ horses: Horse[] }>(`/marketplace/horses${qs ? `?${qs}` : ''}`);
      setHorses(data.horses);
    } catch (e: any) {
      setError(e.message || 'Failed to load listings');
    }
  }, [params?.category, params?.location]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft color={colors.foreground} size={20} />
        </Pressable>
        <Text style={styles.title}>Horse Marketplace</Text>
      </View>

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
          data={horses}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No horses listed yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('HorseDetail', { horseId: item._id })}>
              <View style={styles.thumbWrap}>
                {item.photos?.[0] ? (
                  <Image source={{ uri: getMediaUrl(item.photos[0]) }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]} />
                )}
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
              <View style={styles.cardBody}>
                <Text style={styles.breed}>{item.breed}</Text>
                <Text style={styles.category}>{item.category?.name}</Text>
                {item.location ? (
                  <View style={styles.locationRow}>
                    <MapPin color={colors.mutedForeground} size={12} />
                    <Text style={styles.locationText}>{item.location}</Text>
                  </View>
                ) : null}
                <Text style={styles.price}>₹{item.price.toLocaleString('en-IN')}</Text>
              </View>
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 14,
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: 14,
  },
  list: {
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  thumbWrap: {
    width: 96,
    height: 96,
  },
  thumb: {
    width: 96,
    height: 96,
  },
  thumbPlaceholder: {
    backgroundColor: colors.muted,
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
  cardBody: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'center',
    gap: 2,
  },
  breed: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
  },
  category: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
});
