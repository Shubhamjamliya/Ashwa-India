import React, { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, MapPin, Stethoscope } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { EmptyView, ErrorView, LoadingView } from '../../../components/StateViews';
import { Stars } from '../../../components/Stars';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getMediaUrl } from '../../../services/media';
import { useLocationContext } from '../../../context/LocationContext';
import type { HomeStackParamList } from '../../../navigation/types';
import type { CatalogService, ProviderSummary } from '../types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'ServiceProviders'>;
type Rt = RouteProp<HomeStackParamList, 'ServiceProviders'>;

// Providers offering the chosen service in the user's zone. Tap one to see the full profile.
export function ServiceProvidersScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { serviceKey } = params;
  const { location } = useLocationContext();
  const [serviceName, setServiceName] = useState('');
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    let query = `serviceKey=${encodeURIComponent(serviceKey)}`;
    if (location?.lat != null) query += `&srcLat=${location.lat}&srcLng=${location.lng}`;
    Promise.all([
      apiFetch<{ providers: ProviderSummary[] }>(`/services/providers?${query}`),
      apiFetch<{ services: CatalogService[] }>('/service-catalog', { auth: false }),
    ])
      .then(([providersRes, catalogRes]) => {
        setProviders(providersRes.providers || []);
        setServiceName((catalogRes.services || []).find(s => s.key === serviceKey)?.name || serviceKey);
      })
      .catch(e => setError(e.message || 'Failed to load providers'))
      .finally(() => setLoading(false));
  }, [serviceKey, location?.lat, location?.lng]);

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader
        back="solid"
        title={serviceName || 'Service'}
        subtitle={location?.label ? `Providers serving ${location.label}` : 'Choose a provider to see their profile'}
      />
      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={error} />
      ) : (
        <FlatList
          data={providers}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyView
              icon={<Stethoscope color={colors.mutedForeground} size={32} />}
              title="No providers in your area yet"
              text="Providers appear here when they serve your zone and are online."
            />
          }
          renderItem={({ item: p }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              onPress={() => navigation.navigate('ProviderProfile', { serviceKey, providerId: p.id })}>
              <View style={styles.avatar}>
                {p.gallery?.[0] ? (
                  <Image source={{ uri: getMediaUrl(p.gallery[0]) }} style={styles.avatarImg} />
                ) : (
                  <Stethoscope color="#2563EB" size={20} />
                )}
              </View>
              <View style={styles.body}>
                <Text style={styles.name} numberOfLines={1}>
                  {p.businessName || 'Provider'}
                </Text>
                <View style={styles.ratingRow}>
                  <Stars value={p.rating?.average || 0} />
                  <Text style={styles.meta}>
                    {p.rating?.count ? `${p.rating.average.toFixed(1)} (${p.rating.count})` : 'New'}
                  </Text>
                </View>
                {p.description ? (
                  <Text style={styles.desc} numberOfLines={2}>
                    {p.description}
                  </Text>
                ) : null}
                <View style={styles.footRow}>
                  {p.price ? (
                    <Text style={styles.price}>
                      ₹{p.price.amount.toLocaleString('en-IN')}{' '}
                      {p.price.unit === 'job' ? 'per job' : `per ${p.price.unit}`}
                    </Text>
                  ) : null}
                  {p.distanceKm != null ? (
                    <View style={styles.distance}>
                      <MapPin color={colors.mutedForeground} size={12} />
                      <Text style={styles.meta}>{p.distanceKm} km</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <ChevronRight color={colors.mutedForeground} size={16} />
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  list: { padding: spacing.md, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  pressed: { backgroundColor: colors.muted },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: '#E1ECFC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  body: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  meta: { fontSize: 11, color: colors.mutedForeground },
  desc: { fontSize: 12, color: colors.mutedForeground, marginTop: 4 },
  footRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 6 },
  price: { fontSize: 11, fontWeight: '700', color: colors.primary },
  distance: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
