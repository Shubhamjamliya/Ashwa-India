import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { BellRing, MapPin, Truck, Users } from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { DateTimeField } from '../../../components/DateTimeField';
import { EmptyView, LoadingView } from '../../../components/StateViews';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import type { HomeStackParamList } from '../../../navigation/types';
import type { AvailableTransporter, TransportRequest, TransportType } from '../types';

type Rt = RouteProp<HomeStackParamList, 'TransportResults'>;

export function TransportResultsScreen() {
  const { params } = useRoute<Rt>();
  const { source, destination } = params;

  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<AvailableTransporter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [requestType, setRequestType] = useState<TransportType>('private');
  const [animals, setAnimals] = useState(1);
  const [sharedDate, setSharedDate] = useState('');
  const [enquiring, setEnquiring] = useState(false);
  const [sentFor, setSentFor] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = `srcLat=${source.lat}&srcLng=${source.lng}&destLat=${destination.lat}&destLng=${destination.lng}`;
      const data = await apiFetch<{ transporters: AvailableTransporter[] }>(`/transport/available?${query}`);
      setOptions(data.transporters || []);
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
        body: {
          transporterId,
          source,
          destination,
          type: requestType,
          // Shared trips run on one day for several customers, so the server needs the day and load.
          ...(requestType === 'shared' ? { animals, scheduledDate: sharedDate.slice(0, 10) } : {}),
        },
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

  const typeTab = (type: TransportType, Icon: typeof Truck, label: string) => {
    const active = requestType === type;
    return (
      <Pressable key={type} onPress={() => setRequestType(type)} style={[styles.typeTab, active && styles.typeTabActive]}>
        <Icon size={14} color={active ? colors.white : colors.foreground} />
        <Text style={[styles.typeTabText, active && styles.typeTabTextActive]}>{label}</Text>
      </Pressable>
    );
  };

  const header = (
    <>
      <View style={styles.typeTabs}>
        {typeTab('private', Truck, 'Private')}
        {typeTab('shared', Users, 'Shared')}
      </View>

      {requestType === 'shared' ? (
        <View style={styles.sharedCard}>
          <Text style={styles.sharedText}>
            Shared trips run on your route with other customers on the same day. You pay for your animals and
            distance, so the price drops as others join.
          </Text>
          <View>
            <Text style={styles.fieldLabel}>Animals</Text>
            <View style={styles.stepper}>
              <Pressable hitSlop={8} onPress={() => setAnimals(n => Math.max(1, n - 1))}>
                <Text style={styles.stepText}>−</Text>
              </Pressable>
              <Text style={styles.stepValue}>{animals}</Text>
              <Pressable hitSlop={8} onPress={() => setAnimals(n => n + 1)}>
                <Text style={styles.stepText}>+</Text>
              </Pressable>
            </View>
          </View>
          <View>
            <Text style={styles.fieldLabel}>Travel date</Text>
            <DateTimeField value={sharedDate} onChange={setSharedDate} days={30} withTime={false} />
          </View>
        </View>
      ) : null}
    </>
  );

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title="Available Transport" subtitle={`${source.address} → ${destination.address}`} />

      <FlatList
        data={loading || error ? [] : filtered}
        keyExtractor={item => item.transporter.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        ListEmptyComponent={
          loading ? (
            <LoadingView />
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryBtn} onPress={load}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <EmptyView
              icon={<Truck color="#A3A3A3" size={32} />}
              title={`No ${requestType} transporters available near your pickup location yet.`}
            />
          )
        }
        renderItem={({ item }) => {
          const isSelected = selectedId === item.transporter.id;
          const isSent = sentFor === item.transporter.id;
          const disabled = isSent || enquiring || (requestType === 'shared' && !sharedDate);
          return (
            <Pressable style={[styles.card, isSelected && styles.cardSelected]} onPress={() => setSelectedId(item.transporter.id)}>
              <View style={styles.cardTop}>
                <View style={styles.iconWrap}>
                  <Truck color={colors.primary} size={22} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.transporter.businessName || item.transporter.name || 'Transporter'}
                  </Text>
                  {item.transporter.vehicleTypes?.length ? (
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      {item.transporter.vehicleTypes.join(', ')}
                    </Text>
                  ) : null}
                  <View style={styles.distanceRow}>
                    <MapPin size={12} color={colors.mutedForeground} />
                    <Text style={styles.distanceText}>
                      {item.distanceFromSourceKm} km from pickup
                      {item.tripDistanceKm != null ? ` · ${item.tripDistanceKm} km trip` : ''}
                    </Text>
                  </View>
                </View>
                {item.quote ? (
                  <View style={styles.quote}>
                    <Text style={styles.quoteAmount}>₹{item.quote.amount?.toLocaleString('en-IN')}</Text>
                    <Text style={styles.quoteMeta}>₹{item.quote.pricePerKm}/km</Text>
                    {item.quote.baseFare > 0 ? <Text style={styles.quoteMeta}>+ ₹{item.quote.baseFare} base</Text> : null}
                  </View>
                ) : null}
              </View>

              {isSelected ? (
                <Pressable
                  style={[styles.enquireBtn, disabled && styles.disabled]}
                  disabled={disabled}
                  onPress={() => handleEnquire(item.transporter.id)}>
                  <Text style={styles.enquireText}>
                    {isSent ? 'Enquiry Sent' : enquiring ? 'Ringing...' : 'Enquire (Ring Transporter)'}
                  </Text>
                </Pressable>
              ) : null}
              {isSent ? (
                <View style={styles.sentBadge}>
                  <BellRing size={14} color="#059669" />
                  <Text style={styles.sentBadgeText}>
                    The transporter has been notified. You'll get a notification once they respond.
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  list: { paddingBottom: spacing.lg },
  typeTabs: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: 12, paddingBottom: 12 },
  typeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  typeTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeTabText: { fontSize: 13, fontWeight: '700', color: colors.foreground },
  typeTabTextActive: { color: colors.white },
  sharedCard: {
    gap: 12,
    marginHorizontal: spacing.md,
    marginBottom: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  sharedText: { fontSize: 12, color: '#525252' },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#404040', marginBottom: 4 },
  stepper: {
    height: 40,
    width: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  stepText: { fontSize: 18, fontWeight: '700', color: colors.foreground },
  stepValue: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  errorBox: { alignItems: 'center', gap: 12, paddingHorizontal: spacing.xl, paddingVertical: 64 },
  errorText: { fontSize: 14, color: colors.destructive, textAlign: 'center' },
  retryBtn: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  retryText: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  card: {
    marginHorizontal: spacing.md,
    marginBottom: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  cardSelected: { borderColor: colors.primary },
  cardTop: { flexDirection: 'row', gap: 12 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, minWidth: 0 },
  cardName: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  cardMeta: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  distanceText: { fontSize: 11, color: colors.mutedForeground },
  quote: { alignItems: 'flex-end' },
  quoteAmount: { fontSize: 16, fontWeight: '800', color: colors.primary },
  quoteMeta: { fontSize: 10, color: colors.mutedForeground },
  enquireBtn: { marginTop: 12, borderRadius: radius.md, backgroundColor: colors.primary, paddingVertical: 10, alignItems: 'center' },
  enquireText: { fontSize: 14, fontWeight: '700', color: colors.white },
  disabled: { opacity: 0.6 },
  sentBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: 12,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    padding: 12,
  },
  sentBadgeText: { flex: 1, fontSize: 11, color: colors.foreground },
});
