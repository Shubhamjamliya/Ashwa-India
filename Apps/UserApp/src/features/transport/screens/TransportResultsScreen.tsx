import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BellRing, CreditCard, MapPin, Truck, Users, Wallet } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { DateTimeField } from '../../../components/DateTimeField';
import { EmptyView, LoadingView } from '../../../components/StateViews';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getMediaUrl } from '../../../services/media';
import { isPaymentCancelled, payTransportAdvance } from '../../../services/payments';
import { useAuth } from '../../../context/AuthContext';
import type { AppNavigation, HomeStackParamList } from '../../../navigation/types';
import type { AvailableTransporter, TransportRequest, TransportType, VehicleOption } from '../types';

type Rt = RouteProp<HomeStackParamList, 'TransportResults'>;
type PayMethod = 'wallet' | 'razorpay';
// Private options are vehicle types; shared options are other customers' accepted rides.
type Option = VehicleOption | AvailableTransporter;

const money = (n?: number | null) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const dateLabel = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const isShared = (o: Option): o is AvailableTransporter => 'hostRequestId' in o && Boolean(o.hostRequestId);
const optionKey = (o: Option) => (isShared(o) ? o.hostRequestId! : o.vehicleType.key);

function TypeIcon({ icon }: { icon?: string }) {
  return (
    <View style={styles.iconWrap}>
      {icon ? <Image source={{ uri: getMediaUrl(icon) }} style={styles.fill} resizeMode="contain" /> : <Truck color={colors.primary} size={22} />}
    </View>
  );
}

export function TransportResultsScreen() {
  const { params } = useRoute<Rt>();
  const navigation = useNavigation<AppNavigation>();
  const { user } = useAuth();
  const { source, destination } = params;

  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<Option[]>([]);
  const [tripKm, setTripKm] = useState<number | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [requestType, setRequestType] = useState<TransportType>('private');
  const [animals, setAnimals] = useState(1);
  const [travelDate, setTravelDate] = useState('');
  const [payMethod, setPayMethod] = useState<PayMethod>('wallet');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [booking, setBooking] = useState(false);
  const [sent, setSent] = useState<{ key: string; shared: boolean; offeredTo: number } | null>(null);
  const [error, setError] = useState('');

  const day = travelDate ? travelDate.slice(0, 10) : '';
  const shared = requestType === 'shared';

  const loadWallet = useCallback(() => {
    apiFetch<{ wallet: { balance: number } }>('/payments/wallet')
      .then(d => setWalletBalance(Number(d.wallet?.balance) || 0))
      .catch(() => setWalletBalance(0));
  }, []);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  // Guards against a slower, earlier request (e.g. the Private list) overwriting a faster,
  // later one (e.g. after switching to Shared) once it finally resolves.
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const thisRequestId = ++requestIdRef.current;
    const isStale = () => thisRequestId !== requestIdRef.current;
    if (requestType === 'shared' && !day) {
      setOptions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      let query = `srcLat=${source.lat}&srcLng=${source.lng}&destLat=${destination.lat}&destLng=${destination.lng}&animals=${animals}`;
      if (requestType === 'shared') query += `&type=shared&scheduledDate=${day}`;
      const data = await apiFetch<{ transporters?: AvailableTransporter[]; vehicleTypes?: VehicleOption[]; tripDistanceKm?: number }>(
        `/transport/available?${query}`,
      );
      if (isStale()) return;
      const list: Option[] = requestType === 'shared' ? data.transporters || [] : data.vehicleTypes || [];
      setOptions(list);
      setTripKm(data.tripDistanceKm ?? null);
      // Preselect the first available vehicle, like a ride app.
      setSelectedKey(prev => {
        if (prev && list.some(o => optionKey(o) === prev)) return prev;
        const first = list.find(o => isShared(o) || (o as VehicleOption).available > 0);
        return first ? optionKey(first) : null;
      });
    } catch (err: any) {
      if (isStale()) return;
      setError(err.message || 'Failed to load vehicles');
    } finally {
      if (!isStale()) setLoading(false);
    }
  }, [source, destination, requestType, day, animals]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = options.find(o => optionKey(o) === selectedKey) || null;

  const book = async (item: Option) => {
    setBooking(true);
    setError('');
    const body: Record<string, unknown> = isShared(item)
      ? { type: 'shared', hostRequestId: item.hostRequestId, source, destination, animals, scheduledDate: day }
      : { type: 'private', vehicleType: item.vehicleType.key, source, destination, animals, scheduledDate: day };
    try {
      let data: { request: TransportRequest; offeredTo?: number };
      if ((item.advance || 0) > 0 && payMethod === 'razorpay') {
        const { paymentIntentId, result } = await payTransportAdvance(body, user);
        data = await apiFetch('/transport/requests', {
          method: 'POST',
          body: {
            ...body,
            method: 'razorpay',
            paymentIntentId,
            razorpayPaymentId: result.razorpay_payment_id,
            razorpaySignature: result.razorpay_signature,
          },
        });
      } else {
        data = await apiFetch('/transport/requests', { method: 'POST', body: { ...body, method: 'wallet' } });
      }
      setSent({ key: optionKey(item), shared: isShared(item), offeredTo: data.offeredTo || 0 });
      loadWallet();
    } catch (err: any) {
      if (!isPaymentCancelled(err)) setError(err.message || 'Failed to book');
    } finally {
      setBooking(false);
    }
  };

  const switchType = (type: TransportType) => {
    setRequestType(type);
    setSelectedKey(null);
    setSent(null);
    setOptions([]);
  };

  const typeTab = (type: TransportType, Icon: typeof Truck, label: string) => {
    const active = requestType === type;
    return (
      <Pressable key={type} onPress={() => switchType(type)} style={[styles.typeTab, active && styles.typeTabActive]}>
        <Icon size={14} color={active ? colors.white : colors.foreground} />
        <Text style={[styles.typeTabText, active && styles.typeTabTextActive]}>{label}</Text>
      </Pressable>
    );
  };

  const emptyTitle = shared
    ? day
      ? 'No shared ride on this route for the selected date. Try another date or book a private vehicle.'
      : 'Pick a travel date to see shared rides on this route.'
    : 'No vehicles are set up for booking yet.';

  const advance = selected?.advance || 0;
  const fare = selected?.quote?.amount || 0;
  const walletShort = advance > 0 && payMethod === 'wallet' && walletBalance !== null && walletBalance < advance;
  const unavailable = Boolean(selected && !isShared(selected) && !(selected.available > 0));
  const isSent = Boolean(selected && sent?.key === selectedKey);
  const selectedName = selected?.vehicleType?.name || 'vehicle';
  const buttonText = booking
    ? 'Sending...'
    : unavailable
      ? 'Not available right now'
      : !day
        ? 'Pick a travel date first'
        : `${advance > 0 ? `Pay ${money(advance)} & ` : ''}${shared ? 'request to share' : `book ${selectedName}`}`;

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader
        title="Choose a vehicle"
        subtitle={`${source.address} → ${destination.address}${tripKm != null ? ` · ${tripKm} km` : ''}`}
      />

      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        <View style={styles.typeTabs}>
          {typeTab('private', Truck, 'Private')}
          {typeTab('shared', Users, 'Shared')}
        </View>

        <View style={styles.tripCard}>
          <View>
            <Text style={styles.fieldLabel}>Horses</Text>
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
            <DateTimeField
              value={travelDate}
              onChange={v => {
                setTravelDate(v);
                setSent(null);
              }}
              days={30}
              withTime={false}
            />
          </View>
          {shared ? (
            <Text style={styles.sharedText}>
              Share a vehicle another customer already booked on your route for the same day. They agree first, then the
              transporter confirms. You pay only your share.
            </Text>
          ) : null}
        </View>

        {error ? <Text style={styles.inlineError}>{error}</Text> : null}

        {loading ? (
          <LoadingView />
        ) : options.length === 0 ? (
          <EmptyView icon={shared ? <Users color="#A3A3A3" size={32} /> : <Truck color="#A3A3A3" size={32} />} title={emptyTitle} />
        ) : (
          options.map(item => {
            const key = optionKey(item);
            const isSelected = selectedKey === key;
            const off = !isShared(item) && !(item.available > 0);
            return (
              <Pressable
                key={key}
                style={[styles.option, isSelected && styles.optionSelected, off && styles.faded]}
                onPress={() => {
                  setSelectedKey(key);
                  setSent(null);
                }}>
                <TypeIcon icon={item.vehicleType?.icon} />
                <View style={styles.optionInfo}>
                  <Text style={styles.optionName} numberOfLines={1}>
                    {item.vehicleType?.name || 'Vehicle'}
                  </Text>
                  {isShared(item) ? (
                    <>
                      <Text style={styles.optionMeta} numberOfLines={1}>
                        {item.transporter?.businessName || item.transporter?.name || 'Transporter'} · {item.scheduledDate ? dateLabel(item.scheduledDate) : ''}
                      </Text>
                      {item.rideFrom && item.rideTo ? (
                        <Text style={styles.rideRoute} numberOfLines={1}>
                          Going {item.rideFrom.split(',')[0]} → {item.rideTo.split(',')[0]}
                        </Text>
                      ) : null}
                      <Text style={styles.sharedMeta} numberOfLines={2}>
                        Your trip is on the way · {item.bookedAnimals} booked · room for {item.seatsLeft} more
                      </Text>
                    </>
                  ) : (
                    <>
                      {item.vehicleType.description ? (
                        <Text style={styles.optionMeta} numberOfLines={1}>
                          {item.vehicleType.description}
                        </Text>
                      ) : null}
                      <View style={styles.distanceRow}>
                        <MapPin size={11} color={off ? '#A3A3A3' : '#047857'} />
                        <Text style={[styles.availText, off && styles.offText]}>
                          {off ? 'Not available near you right now' : `${item.available} nearby · closest ${item.nearestKm} km away`}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
                <View style={styles.quote}>
                  <Text style={styles.quoteAmount}>{money(item.quote?.amount)}</Text>
                  {isShared(item) && item.fullQuote && item.fullQuote.amount > (item.quote?.amount || 0) ? (
                    <Text style={styles.quoteStruck}>{money(item.fullQuote.amount)}</Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })
        )}

        {selected && !loading ? (
          <View style={styles.checkout}>
            {isSent ? (
              <View style={styles.sentRow}>
                <BellRing size={16} color="#059669" />
                <Text style={styles.sentText}>
                  {sent?.shared
                    ? 'Request sent. The customer who booked this ride will be asked to share, then the transporter confirms. '
                    : `Request sent to ${sent?.offeredTo} nearby transporter${sent?.offeredTo === 1 ? '' : 's'}. The first to accept gets your booking. `}
                  <Text style={styles.link} onPress={() => navigation.navigate('Booking', { screen: 'BookingsMain' })}>
                    View my bookings
                  </Text>
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.summary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{shared ? 'Your share' : `${selectedName} fare`}</Text>
                    <Text style={styles.summaryValue}>{money(fare)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Advance to pay now</Text>
                    <Text style={styles.summaryAdvance}>{money(advance)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Pay at delivery</Text>
                    <Text style={styles.summaryValue}>{money(Math.max(0, fare - advance))}</Text>
                  </View>
                </View>

                {advance > 0 ? (
                  <View style={styles.payRow}>
                    <Pressable style={[styles.payOption, payMethod === 'wallet' && styles.payOptionActive]} onPress={() => setPayMethod('wallet')}>
                      <Wallet color={colors.primary} size={16} />
                      <View>
                        <Text style={styles.payTitle}>Wallet</Text>
                        <Text style={styles.payHint}>Balance {money(walletBalance)}</Text>
                      </View>
                    </Pressable>
                    <Pressable style={[styles.payOption, payMethod === 'razorpay' && styles.payOptionActive]} onPress={() => setPayMethod('razorpay')}>
                      <CreditCard color={colors.primary} size={16} />
                      <View>
                        <Text style={styles.payTitle}>Pay online</Text>
                        <Text style={styles.payHint}>UPI, cards</Text>
                      </View>
                    </Pressable>
                  </View>
                ) : null}
                {walletShort ? (
                  <Text style={styles.walletShort}>
                    Wallet balance is too low.{' '}
                    <Text style={styles.link} onPress={() => navigation.navigate('Wallet')}>
                      Add money
                    </Text>{' '}
                    or pay online.
                  </Text>
                ) : null}

                <Pressable
                  style={[styles.bookBtn, (booking || !day || walletShort || unavailable) && styles.faded]}
                  disabled={booking || !day || walletShort || unavailable}
                  onPress={() => book(selected)}>
                  <Text style={styles.bookText}>{buttonText}</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  fill: { width: '100%', height: '100%' },
  faded: { opacity: 0.6 },
  list: { paddingBottom: spacing.xl },
  typeTabs: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: 12, paddingBottom: 12 },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  typeTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeTabText: { fontSize: 13, fontWeight: '700', color: colors.foreground },
  typeTabTextActive: { color: colors.white },
  tripCard: {
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
  inlineError: {
    marginHorizontal: spacing.md,
    marginBottom: 12,
    borderRadius: radius.md,
    backgroundColor: '#FEF2F2',
    padding: 12,
    fontSize: 12,
    color: colors.destructive,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: spacing.md,
    marginBottom: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 12,
  },
  optionSelected: { borderColor: colors.primary, borderWidth: 2, backgroundColor: '#FBF6EC', padding: 11 },
  iconWrap: {
    width: 44,
    height: 44,
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: { flex: 1, minWidth: 0 },
  optionName: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  optionMeta: { fontSize: 11, color: colors.mutedForeground, marginTop: 1 },
  sharedMeta: { fontSize: 11, color: '#1D4ED8', marginTop: 2 },
  rideRoute: { fontSize: 11, fontWeight: '600', color: colors.foreground, marginTop: 2 },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  availText: { fontSize: 11, color: '#047857' },
  offText: { color: '#A3A3A3' },
  quote: { alignItems: 'flex-end' },
  quoteAmount: { fontSize: 16, fontWeight: '800', color: colors.foreground },
  quoteStruck: { fontSize: 10, color: '#A3A3A3', textDecorationLine: 'line-through' },
  checkout: {
    gap: 12,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  summary: { gap: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 12, color: '#525252' },
  summaryValue: { fontSize: 12, fontWeight: '700', color: colors.foreground },
  summaryAdvance: { fontSize: 12, fontWeight: '800', color: colors.primary },
  payRow: { flexDirection: 'row', gap: spacing.sm },
  payOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  payOptionActive: { borderColor: colors.primary, backgroundColor: '#FBF6EC' },
  payTitle: { fontSize: 12, fontWeight: '700', color: colors.foreground },
  payHint: { fontSize: 10, color: colors.mutedForeground },
  walletShort: { fontSize: 11, color: colors.destructive },
  link: { fontWeight: '700', color: colors.primary, textDecorationLine: 'underline' },
  bookBtn: { borderRadius: radius.md, backgroundColor: colors.primary, paddingVertical: 12, alignItems: 'center' },
  bookText: { fontSize: 14, fontWeight: '700', color: colors.white },
  sentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  sentText: { flex: 1, fontSize: 12, color: colors.foreground },
});
