import React, { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Stethoscope } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { EmptyView, ErrorView, LoadingView } from '../../../components/StateViews';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getMediaUrl } from '../../../services/media';
import type { HomeStackParamList } from '../../../navigation/types';
import type { CatalogService } from '../types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Services'>;

// Services added by the admin. Tapping one opens the providers who offer it.
export function ServicesScreen() {
  const navigation = useNavigation<Nav>();
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{ services: CatalogService[] }>('/service-catalog', { auth: false })
      .then(data => setServices(data.services || []))
      .catch(e => setError(e.message || 'Failed to load services'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title="Services" back="solid" />
      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={error} />
      ) : (
        <FlatList
          data={services}
          keyExtractor={item => item.key}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyView
              icon={<Stethoscope color={colors.mutedForeground} size={32} />}
              title="No services yet"
              text="Services will appear here as they are added."
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              onPress={() => navigation.navigate('ServiceProviders', { serviceKey: item.key })}>
              <View style={styles.thumb}>
                {item.image ? (
                  <Image source={{ uri: getMediaUrl(item.image) }} style={styles.thumbImg} />
                ) : (
                  <Stethoscope color="#2563EB" size={24} />
                )}
              </View>
              <View style={styles.body}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.description ? (
                  <Text style={styles.desc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
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
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  pressed: { backgroundColor: colors.muted },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: '#E1ECFC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  body: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '700', color: colors.foreground },
  desc: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
});
