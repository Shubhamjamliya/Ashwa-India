import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Activity, Bell, Calendar, Clock, Layers, MapPin, Phone, Truck, Wallet as WalletIcon } from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { GradientBox } from '../../../components/GradientBox';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useSocketEvents } from '../../../services/useSocketEvents';
import { countUnread } from '../../../services/notifications';
import { getCurrentLocation, watchLocation, type LatLng } from '../../../services/location';
import { money } from '../../../utils/format';
import type { AppNavigation } from '../../../navigation/types';
import type { TransportRequest } from '../../trips/types';
import { EnquiryCard, RouteLines, dateLabel } from '../components/EnquiryCard';

// While online, the saved location is refreshed this often so users are matched against where
// the transporter is now.
const LOCATION_SYNC_MS = 60000;


type Dashboard = { active: number; upcoming: number; completed: number; vehicles: number; availableVehicles: number };

function StatCard({
  icon: Icon,
  label,
  value,
  from,
  to,
  onPress,
}: {
  icon: typeof Clock;
  label: string;
  value: string | number;
  from: string;
  to: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.statCardWrap} onPress={onPress} disabled={!onPress}>
      <GradientBox from={from} to={to} style={styles.statCard}>
        <View style={styles.statBubble} />
        <View style={styles.statIcon}>
          <Icon color={colors.white} size={18} />
        </View>
        <Text style={styles.statValue} numberOfLines={1}>
          {value}
        </Text>
        <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
      </GradientBox>
    </Pressable>
  );
}

export function HomeScreen() {
  const { user, updateUser } = useAuth();
  const navigation = useNavigation<AppNavigation>();
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [isOnline, setIsOnline] = useState(user?.isOnline !== false);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [locationError, setLocationError] = useState('');
  const userRef = useRef(user);
  userRef.current = user;

  const load = useCallback(async () => {
    const [reqRes, walletRes, unreadRes, statsRes] = await Promise.allSettled([
      apiFetch<{ requests: TransportRequest[] }>('/transport/requests/incoming'),
      apiFetch<{ wallet: { balance: number } }>('/payments/wallet'),
      countUnread(),
      apiFetch<Dashboard>('/transporter-ops/dashboard'),
    ]);
    if (reqRes.status === 'fulfilled') setRequests(reqRes.value.requests || []);
    if (walletRes.status === 'fulfilled') setWallet(walletRes.value.wallet);
    if (unreadRes.status === 'fulfilled') setUnreadCount(unreadRes.value);
    if (statsRes.status === 'fulfilled') setStats(statsRes.value);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useSocketEvents({
    'transport:new': (request: TransportRequest) => {
      setRequests(prev => [request, ...prev.filter(r => r._id !== request._id)]);
    },
    'transport:update': (updated: TransportRequest) => {
      setRequests(prev => prev.map(r => (r._id === updated._id ? { ...r, ...updated } : r)));
    },
    // An open request another transporter accepted (or the user cancelled) leaves this list.
    'transport:taken': ({ requestId }: { requestId: string }) => {
      setRequests(prev => prev.filter(r => r._id !== requestId));
    },
  });

  // Errors reach the enquiry card, which shows them (e.g. the vehicle is already full).
  const respond = async (id: string, action: 'accept' | 'reject') => {
    setResponding(true);
    try {
      const data = await apiFetch<{ request: TransportRequest & { declined?: boolean } }>(`/transport/requests/${id}/respond`, {
        method: 'PATCH',
        body: { action },
      });
      setRequests(prev => (data.request.declined ? prev.filter(r => r._id !== id) : prev.map(r => (r._id === id ? data.request : r))));
    } catch (e: any) {
      // Someone else accepted first: drop it from the list.
      if (/already accepted/i.test(e?.message || '')) setRequests(prev => prev.filter(r => r._id !== id));
      throw e;
    } finally {
      setResponding(false);
    }
  };

  const saveAvailability = async (nextOnline: boolean, location?: LatLng) => {
    const data = await apiFetch<{ transporter: any }>('/transporters/me/availability', {
      method: 'PATCH',
      body: location ? { isOnline: nextOnline, location } : { isOnline: nextOnline },
    });
    const current = userRef.current;
    if (current) await updateUser({ ...current, isOnline: data.transporter?.isOnline ?? nextOnline, location: data.transporter?.location });
  };

  const toggleOnline = async () => {
    const next = !isOnline;
    setTogglingOnline(true);
    setLocationError('');
    try {
      if (next) await saveAvailability(true, await getCurrentLocation());
      else await saveAvailability(false);
      setIsOnline(next);
    } catch (e: any) {
      setLocationError(e.message || 'Could not go online');
    } finally {
      setTogglingOnline(false);
    }
  };

  // While online, keep the saved location fresh.
  useEffect(() => {
    if (!isOnline) return;
    let lastSentAt = 0;
    return watchLocation(
      point => {
        const now = Date.now();
        if (now - lastSentAt < LOCATION_SYNC_MS) return;
        lastSentAt = now;
        saveAvailability(true, point).catch(() => {});
      },
      () => setLocationError('Location access is needed to stay visible to users.'),
      { maximumAge: 30000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const enquiries = useMemo(() => requests.filter(r => r.status === 'pending'), [requests]);
  const active = useMemo(() => requests.filter(r => r.status === 'accepted'), [requests]);
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const acceptedCount = requests.filter(r => r.status === 'accepted').length;
  const firstName = (user?.name || 'there').split(' ')[0];
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const dash = (v: string | number) => (loading ? '—' : v);

  return (
    <Screen style={styles.noPadding}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.today}>{today}</Text>
            <Text style={styles.hi}>Hi, {firstName}</Text>
          </View>
          <Pressable style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')} hitSlop={6}>
            <Bell color={colors.foreground} size={17} />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <View style={[styles.onlineCard, isOnline ? styles.online : styles.offline]}>
          <View style={styles.flex}>
            <Text style={styles.onlineTitle}>{isOnline ? "You're Online" : "You're Offline"}</Text>
            <Text style={styles.onlineSub}>
              {togglingOnline ? 'Updating your location...' : isOnline ? 'Receiving requests near you' : 'Turn on to receive requests'}
            </Text>
          </View>
          <Pressable
            onPress={toggleOnline}
            disabled={togglingOnline}
            style={[styles.switch, isOnline ? styles.switchOn : styles.switchOff, togglingOnline && styles.faded]}>
            {togglingOnline ? <ActivityIndicator size="small" color={colors.white} /> : <View style={styles.knob} />}
          </Pressable>
        </View>
        {locationError ? <Text style={styles.locationError}>{locationError}</Text> : null}

        {stats ? (
          <View style={styles.opsRow}>
            {(
              [
                ['Active', stats.active],
                ['Upcoming', stats.upcoming],
                ['Completed', stats.completed],
                ['Free vehicles', `${stats.availableVehicles}/${stats.vehicles}`],
              ] as const
            ).map(([label, value]) => (
              <View key={label} style={styles.opsCell}>
                <Text style={styles.opsValue}>{value}</Text>
                <Text style={styles.opsLabel} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.profileCard}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Truck color={colors.primary} size={26} />
            </View>
          </View>
          <View style={styles.flex}>
            <Text style={styles.profileName} numberOfLines={1}>
              {user?.businessName || user?.name || 'Transporter'}
            </Text>
            <Text style={styles.profilePhone}>{user?.phone}</Text>
            <View style={styles.chips}>
              <Text style={[styles.profileChip, styles.goldText]}>
                {user?.serviceType === 'both' ? 'Private & Shared' : cap(user?.serviceType || 'private')}
              </Text>
              {user?.serviceArea ? (
                <View style={styles.areaChip}>
                  <MapPin color={colors.navyMuted} size={10} />
                  <Text style={styles.areaText}>{user.serviceArea}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard icon={Clock} label="Pending requests" value={dash(pendingCount)} from="#FBBF24" to="#D97706" />
          <StatCard icon={Activity} label="Active bookings" value={dash(acceptedCount)} from="#10B981" to="#047857" />
          <StatCard
            icon={WalletIcon}
            label="Wallet balance"
            value={dash(money(wallet?.balance))}
            from={colors.primary}
            to="#8A6416"
            onPress={() => navigation.navigate('Wallet')}
          />
          <StatCard
            icon={Layers}
            label="Total requests"
            value={dash(requests.length)}
            from={colors.navyLight}
            to={colors.navy}
            onPress={() => navigation.navigate('Bookings')}
          />
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>New Enquiries</Text>
          <Text style={[styles.countPill, styles.enquiryPill]}>{enquiries.length}</Text>
        </View>
        {!loading && enquiries.length === 0 ? (
          <Text style={styles.noEnquiries}>No new enquiries. Requests from users show up here.</Text>
        ) : (
          <View style={styles.list}>
            {enquiries.map(req => (
              <EnquiryCard key={req._id} req={req} busy={responding} onRespond={respond} />
            ))}
          </View>
        )}

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Active Bookings</Text>
          <Text style={styles.countPill}>{active.length}</Text>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : active.length === 0 ? (
          <View style={styles.empty}>
            <Truck color="#A3A3A3" size={32} />
            <Text style={styles.emptyTitle}>No active bookings</Text>
            <Text style={styles.emptyText}>Enquiries you accept appear here.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {active.map(req => {
              return (
                <View key={req._id} style={styles.card}>
                  <View style={[styles.cardBar, styles.cardBarAccepted]} />
                  <View style={styles.cardTop}>
                    <Text style={styles.cardUser} numberOfLines={1}>
                      {req.user?.name || req.user?.phone}
                    </Text>
                    <Text style={[styles.chip, styles.chipAccepted]}>Accepted</Text>
                  </View>
                  <View style={styles.routeWrap}>
                    <RouteLines source={req.source} destination={req.destination} />
                  </View>
                  {req.scheduledDate ? (
                    <View style={[styles.inline, styles.dateRow]}>
                      <Calendar color={colors.mutedForeground} size={12} />
                      <Text style={styles.dateText}>
                        {dateLabel(req.scheduledDate)} · {req.animals || 1} animal(s) · {money(req.quote?.amount)}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.cardFoot}>
                    <Text style={styles.typePill}>{req.type === 'shared' || req.sharedRun ? 'Shared ride' : 'Private transport'}</Text>
                    {req.user?.phone ? (
                      <Pressable style={styles.inline} onPress={() => Linking.openURL(`tel:${req.user?.phone}`)}>
                        <Phone color={colors.primary} size={12} />
                        <Text style={styles.callText}>Call user</Text>
                      </Pressable>
                    ) : null}
                  </View>
                  <Pressable style={styles.openBtn} onPress={() => navigation.navigate('Trip', { requestId: req._id })}>
                      <Text style={styles.openText}>Open booking</Text>
                    </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1, minWidth: 0 },
  faded: { opacity: 0.6 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  content: { paddingBottom: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  today: { fontSize: 12, color: colors.mutedForeground },
  hi: { fontSize: 20, fontWeight: '800', color: colors.foreground },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: radius.full,
    backgroundColor: colors.destructive,
    borderWidth: 1.5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 9, fontWeight: '700', color: colors.white },
  onlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  online: { backgroundColor: '#059669' },
  offline: { backgroundColor: colors.navy },
  onlineTitle: { fontSize: 14, fontWeight: '800', color: colors.white },
  onlineSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  switch: { width: 48, height: 28, borderRadius: 14, padding: 3, justifyContent: 'center' },
  switchOn: { alignItems: 'flex-end', backgroundColor: 'rgba(255,255,255,0.4)' },
  switchOff: { alignItems: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)' },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white },
  locationError: { fontSize: 12, color: colors.destructive, marginHorizontal: spacing.md, marginTop: spacing.sm },
  opsRow: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.md, marginTop: 12 },
  opsCell: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 10,
  },
  opsValue: { fontSize: 16, fontWeight: '800', color: colors.foreground },
  opsLabel: { fontSize: 10, fontWeight: '600', color: colors.mutedForeground },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.navy,
    padding: spacing.md,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: { fontSize: 16, fontWeight: '700', color: colors.white },
  profilePhone: { fontSize: 12, color: colors.navyMuted, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
  profileChip: {
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: colors.navyLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  goldText: { color: colors.primary },
  areaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.navyLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  areaText: { fontSize: 10, fontWeight: '700', color: colors.navyMuted },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginHorizontal: spacing.md, marginTop: spacing.md },
  statCardWrap: { width: '47.8%' },
  statCard: { borderRadius: radius.lg, padding: spacing.md },
  statBubble: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.white, marginTop: 12 },
  statLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.foreground },
  countPill: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentForeground,
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  loading: { paddingVertical: 64, alignItems: 'center' },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D8D3C5',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: 40,
  },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  emptyText: { fontSize: 12, color: colors.mutedForeground, textAlign: 'center' },
  list: { gap: 12, marginTop: 12, paddingHorizontal: spacing.md },
  card: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
    paddingLeft: 20,
  },
  cardBar: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 4 },
  cardBarAccepted: { backgroundColor: '#10B981' },
  chipAccepted: { backgroundColor: '#D1FAE5', color: '#047857' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardUser: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.foreground },
  chip: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  route: { flexDirection: 'row', gap: 12, marginTop: 12 },
  routeRail: { alignItems: 'center', paddingTop: 4 },
  dotStart: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#10B981', backgroundColor: colors.white },
  routeLine: { width: 1, flex: 1, minHeight: 10, marginVertical: 2, backgroundColor: colors.border },
  routeText: { flex: 1, minWidth: 0, gap: spacing.sm },
  address: { fontSize: 12, color: '#525252' },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  typePill: {
    fontSize: 10,
    fontWeight: '600',
    color: '#525252',
    backgroundColor: colors.muted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  callText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  openBtn: { marginTop: 12, borderRadius: radius.md, backgroundColor: colors.navy, paddingVertical: 10, alignItems: 'center' },
  openText: { fontSize: 13, fontWeight: '700', color: colors.white },
  routeWrap: { marginTop: 12 },
  dateRow: { marginTop: spacing.sm },
  dateText: { fontSize: 11, fontWeight: '600', color: colors.mutedForeground },
  enquiryPill: { backgroundColor: '#FEF3C7', color: '#92400E' },
  noEnquiries: {
    marginHorizontal: spacing.md,
    marginTop: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D8D3C5',
    backgroundColor: colors.card,
    padding: spacing.md,
    fontSize: 12,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: radius.md,
    paddingVertical: 10,
  },
  declineBtn: { backgroundColor: colors.muted },
  declineText: { fontSize: 13, fontWeight: '700', color: colors.foreground },
  acceptBtn: { backgroundColor: colors.primary },
  acceptText: { fontSize: 13, fontWeight: '700', color: colors.white },
});
