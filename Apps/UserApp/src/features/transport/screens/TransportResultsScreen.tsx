import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, BellRing, MapPin, Truck, Users } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import type { HomeStackParamList } from '../../../navigation/types';
import type { AvailableTransporter, TransportRequest, TransportType } from '../types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'TransportResults'>;
type Rt = RouteProp<HomeStackParamList, 'TransportResults'>;

export function TransportResultsScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { source, destination } = params;

  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<AvailableTransporter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [requestType, setRequestType] = useState<TransportType>('private');
  const [enquiring, setEnquiring] = useState(false);
  const [sentFor, setSentFor] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = `srcLat=${source.lat}&srcLng=${source.lng}&destLat=${destination.lat}&destLng=${destination.lng}`;
      const data = await apiFetch<{ transporters: AvailableTransporter[] }>(`/transport/available?${query}`);
      setOptions(data.transporters);
    } catch (err: any) {
      setError(err.message || 'Failed to load transporters');
    } finally {
      setLoading(false);
    }
  }, [source, destination]);

  useEffect(() => {
    load();
  }, [load]);

  const handleEnquire = async (transporterId: string) => {
    setEnquiring(true);
    setError('');
    try {
      await apiFetch<{ request: TransportRequest }>('/transport/requests', {
        method: 'POST',
        body: { transporterId, source, destination, type: requestType },
      });
      setSentFor(transporterId);
    } catch (err: any) {
      setError(err.message || 'Failed to send enquiry');
    } finally {
      setEnquiring(false);
    }
  };

  const filtered = options.filter(o =>
    requestType === 'shared'
      ? o.transporter.serviceType === 'shared' || o.transporter.serviceType === 'both'
      : o.transporter.serviceType === 'private' || o.transporter.serviceType === 'both',
  );

  return (
    <Screen style={styles.noPadding}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft color={colors.foreground} size={20} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Available Transport</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {source.address} → {destination.address}
          </Text>
        </View>
      </View>

      <View style={styles.typeTabs}>
        <Pressable
          style={[styles.typeTab, requestType === 'private' && styles.typeTabActive]}
          onPress={() => setRequestType('private')}>
          <Truck size={14} color={requestType === 'private' ? colors.white : colors.foreground} />
          <Text style={[styles.typeTabText, requestType === 'private' && styles.typeTabTextActive]}>
            Private
          </Text>
        </Pressable>
        <Pressable
          style={[styles.typeTab, requestType === 'shared' && styles.typeTabActive]}
          onPress={() => setRequestType('shared')}>
          <Users size={14} color={requestType === 'shared' ? colors.white : colors.foreground} />
          <Text style={[styles.typeTabText, requestType === 'shared' && styles.typeTabTextActive]}>
            Shared
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Retry" variant="outline" onPress={load} style={styles.retryBtn} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Truck color={colors.mutedForeground} size={32} />
          <Text style={styles.emptyText}>
            No {requestType} transporters available near your pickup location yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.transporter.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isSelected = selectedId === item.transporter.id;
            const isSent = sentFor === item.transporter.id;
            return (
              <Pressable
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => setSelectedId(item.transporter.id)}>
                <View style={styles.cardTop}>
                  <View style={styles.iconWrap}>
                    <Truck color={colors.primary} size={22} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {item.transporter.businessName || item.transporter.name || 'Transporter'}
                    </Text>
                    {item.transporter.vehicleTypes && item.transporter.vehicleTypes.length > 0 && (
                      <Text style={styles.cardMeta} numberOfLines={1}>
                        {item.transporter.vehicleTypes.join(', ')}
                      </Text>
                    )}
                    <View style={styles.distanceRow}>
                      <MapPin size={12} color={colors.mutedForeground} />
                      <Text style={styles.distanceText}>
                        {item.distanceFromSourceKm} km from pickup
                        {item.tripDistanceKm != null ? ` · ${item.tripDistanceKm} km trip` : ''}
                      </Text>
                    </View>
                  </View>
                </View>

                {isSelected && (
                  <Button
                    title={isSent ? 'Enquiry Sent' : enquiring ? 'Ringing...' : 'Enquire (Ring Transporter)'}
                    onPress={() => handleEnquire(item.transporter.id)}
                    loading={enquiring && !isSent}
                    disabled={isSent}
                    style={styles.enquireBtn}
                  />
                )}
                {isSent && (
                  <View style={styles.sentBadge}>
                    <BellRing size={12} color={colors.success} />
                    <Text style={styles.sentBadgeText}>
                      The transporter has been notified. You'll get a notification once they respond.
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
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
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.foreground,
  },
  subtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  typeTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  typeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  typeTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
  },
  typeTabTextActive: {
    color: colors.white,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    fontSize: 13,
    color: colors.destructive,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: spacing.sm,
    minWidth: 120,
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  list: {
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardSelected: {
    borderColor: colors.primary,
  },
  cardTop: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  distanceText: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  enquireBtn: {
    marginTop: spacing.sm,
  },
  sentBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: spacing.sm,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  sentBadgeText: {
    flex: 1,
    fontSize: 11,
    color: colors.foreground,
  },
});
