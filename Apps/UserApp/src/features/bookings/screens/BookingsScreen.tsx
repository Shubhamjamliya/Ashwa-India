import React, { useCallback, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Truck,
  XCircle,
} from 'lucide-react-native';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { MapEmbed } from '../../../components/map/MapEmbed';
import { EmptyView, LoadingView } from '../../../components/StateViews';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { useSocketEvents } from '../../../services/useSocketEvents';
import { fmtTime, money } from '../../../utils/format';
import { directionsUrl, distanceKm } from '../../../utils/geo';
import { RateForm } from '../components/RateForm';
import type { TransportRequest, TransportRequestStatus, TransportStage } from '../../transport/types';

const STATUS_META: Record<TransportRequestStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Waiting for response', color: colors.warning, icon: Clock },
  accepted: { label: 'Accepted', color: colors.success, icon: CheckCircle2 },
  completed: { label: 'Delivered', color: colors.navy, icon: CheckCircle2 },
  rejected: { label: 'Declined', color: colors.destructive, icon: XCircle },
  cancelled: { label: 'Cancelled', color: colors.mutedForeground, icon: XCircle },
};

const STAGE_TEXT: Record<TransportStage, string> = {
  scheduled: 'Booking confirmed. The transporter will start soon.',
  to_pickup: 'The transporter is on the way to pick up your horse.',
  in_transit: 'Your horse is on the way to the drop-off.',
  delivered: 'Delivered.',
};

type ServiceStatus = 'pending' | 'accepted' | 'completed' | 'rejected' | 'cancelled';

const SERVICE_STATUS: Record<ServiceStatus, { label: string; color: string }> = {
  pending: { label: 'Waiting for response', color: colors.warning },
  accepted: { label: 'Accepted', color: colors.success },
  completed: { label: 'Completed', color: colors.navy },
  rejected: { label: 'Declined', color: colors.destructive },
  cancelled: { label: 'Cancelled', color: colors.mutedForeground },
};

type ServiceRequest = {
  _id: string;
  serviceType: string;
  status: ServiceStatus;
  message?: string;
  amount?: number;
  createdAt: string;
  provider?: { name?: string; businessName?: string; phone?: string };
};

function OtpCard({ label, code, hint }: { label: string; code: string; hint: string }) {
  return (
    <View style={styles.otpCard}>
      <View style={styles.between}>
        <View style={styles.inline}>
          <ShieldCheck color={colors.accentForeground} size={14} />
          <Text style={styles.otpLabel}>{label}</Text>
        </View>
        <Text style={styles.otpCode}>{code}</Text>
      </View>
      <Text style={styles.otpHint}>{hint}</Text>
    </View>
  );
}

function CallButton({ phone, label }: { phone: string; label: string }) {
  return (
    <Pressable style={styles.callBtn} onPress={() => Linking.openURL(`tel:${phone}`)}>
      <Phone color={colors.white} size={16} />
      <Text style={styles.callText}>{label}</Text>
    </Pressable>
  );
}

function ActiveDetails({ req }: { req: TransportRequest }) {
  const stage = req.stage;
  const loc = req.transporterLocation;
  const showTracking =
    req.status === 'accepted' && (stage === 'to_pickup' || stage === 'in_transit') && loc?.lat != null;
  const target = stage === 'to_pickup' ? req.source : stage === 'in_transit' ? req.destination : null;
  const away = showTracking && loc && target ? distanceKm(loc, target) : null;

  return (
    <View style={styles.active}>
      {stage ? <Text style={styles.stageText}>{STAGE_TEXT[stage]}</Text> : null}

      {!req.pickupVerifiedAt && req.pickupOtp ? (
        <OtpCard label="Pickup OTP" code={req.pickupOtp} hint="Share this with the transporter when they reach you." />
      ) : null}
      {stage === 'in_transit' && req.dropOtp ? (
        <OtpCard
          label="Delivery OTP"
          code={req.dropOtp}
          hint="Share this with the transporter at the drop-off to complete the trip."
        />
      ) : null}

      {showTracking && loc ? (
        <View style={styles.tracking}>
          <MapEmbed lat={loc.lat} lng={loc.lng} style={styles.trackingMap} />
          <View style={styles.trackingFoot}>
            <Text style={[styles.trackingText, styles.flex]}>
              {away != null ? `${away.toFixed(1)} km to ${stage === 'to_pickup' ? 'you' : 'drop-off'}` : 'Live location'}
              {loc.updatedAt ? ` · updated ${fmtTime(loc.updatedAt)}` : ''}
            </Text>
            <Pressable style={styles.inline} onPress={() => Linking.openURL(directionsUrl(loc.lat, loc.lng))}>
              <Navigation color={colors.primary} size={12} />
              <Text style={styles.mapLink}>Map</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {req.transporter?.phone ? <CallButton phone={req.transporter.phone} label="Call transporter" /> : null}
    </View>
  );
}

function TransportBookings() {
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      apiFetch<{ requests: TransportRequest[] }>('/transport/requests/mine')
        .then(d => setRequests(d.requests || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []),
  );

  useSocketEvents({
    'transport:update': (updated: TransportRequest) =>
      setRequests(prev =>
        prev.map(r =>
          r._id === updated._id
            ? { ...r, ...updated, pickupOtp: updated.pickupOtp ?? r.pickupOtp, dropOtp: updated.dropOtp ?? r.dropOtp }
            : r,
        ),
      ),
    'transport:location': ({ requestId, lat, lng, updatedAt }: any) =>
      setRequests(prev =>
        prev.map(r => (r._id === requestId ? { ...r, transporterLocation: { lat, lng, updatedAt } } : r)),
      ),
  });

  if (loading) return <LoadingView />;

  return (
    <FlatList
      data={requests}
      keyExtractor={item => item._id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <EmptyView
          icon={<Calendar color={colors.mutedForeground} size={32} />}
          title="No bookings yet"
          text="Your transport bookings will show up here."
        />
      }
      renderItem={({ item }) => {
        const meta = STATUS_META[item.status] || STATUS_META.pending;
        const StatusIcon = meta.icon;
        return (
          <View style={styles.card}>
            <View style={styles.between}>
              <View style={[styles.inline, styles.flex]}>
                <Truck color={colors.primary} size={16} />
                <Text style={styles.name} numberOfLines={1}>
                  {item.transporter?.businessName || item.transporter?.name || 'Transporter'}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${meta.color}1A` }]}>
                <StatusIcon size={12} color={meta.color} />
                <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
              </View>
            </View>
            <View style={styles.routeRow}>
              <MapPin size={12} color={colors.mutedForeground} />
              <Text style={styles.routeText} numberOfLines={2}>
                {item.source.address} → {item.destination.address}
              </Text>
            </View>
            <View style={[styles.between, styles.mt6]}>
              <Text style={styles.typeText}>{item.type === 'shared' ? 'Shared ride' : 'Private transport'}</Text>
              {item.quote?.amount != null ? <Text style={styles.amount}>{money(item.quote.amount)}</Text> : null}
            </View>
            {item.status === 'accepted' ? <ActiveDetails req={item} /> : null}
            {item.status === 'completed' ? (
              <RateForm
                endpoint={`/transport/requests/${item._id}/review`}
                question="How was the transport?"
                thanks="Thanks for rating this trip"
                reviewed={item.reviewed}
              />
            ) : null}
          </View>
        );
      }}
    />
  );
}

function ServiceBookings() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      apiFetch<{ requests: ServiceRequest[] }>('/services/requests/mine')
        .then(d => setRequests(d.requests || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []),
  );

  useSocketEvents({
    'service:update': (updated: ServiceRequest) =>
      setRequests(prev => prev.map(r => (r._id === updated._id ? { ...r, ...updated } : r))),
  });

  if (loading) return <LoadingView />;

  return (
    <FlatList
      data={requests}
      keyExtractor={item => item._id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <EmptyView
          icon={<Calendar color={colors.mutedForeground} size={32} />}
          title="No service bookings yet"
          text="Book a service from the Service Providers tile on Home."
        />
      }
      renderItem={({ item }) => {
        const meta = SERVICE_STATUS[item.status] || SERVICE_STATUS.pending;
        return (
          <View style={styles.card}>
            <View style={styles.between}>
              <Text style={[styles.name, styles.flex, styles.capitalize]} numberOfLines={1}>
                {item.serviceType}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: `${meta.color}1A` }]}>
                <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
              </View>
            </View>
            <Text style={styles.provider}>{item.provider?.businessName || item.provider?.name || 'Provider'}</Text>
            {item.message ? (
              <Text style={styles.routeText} numberOfLines={2}>
                {item.message}
              </Text>
            ) : null}
            <View style={[styles.between, styles.mt6]}>
              <Text style={styles.typeText}>
                {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </Text>
              {item.amount ? <Text style={styles.amount}>{money(item.amount)}</Text> : null}
            </View>
            {item.status === 'accepted' && item.provider?.phone ? (
              <View style={styles.mt12}>
                <CallButton phone={item.provider.phone} label="Call provider" />
              </View>
            ) : null}
            {item.status === 'completed' ? (
              <RateForm
                endpoint={`/services/requests/${item._id}/review`}
                question="How was the service?"
                thanks="Thanks for rating this service"
              />
            ) : null}
          </View>
        );
      }}
    />
  );
}

export function BookingsScreen() {
  const [tab, setTab] = useState<'transport' | 'services'>('transport');

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title="My Bookings" back="solid" />
      <View style={styles.tabs}>
        {(
          [
            { key: 'transport', label: 'Transport' },
            { key: 'services', label: 'Services' },
          ] as const
        ).map(t => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tab, tab === t.key && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.flex}>{tab === 'transport' ? <TransportBookings /> : <ServiceBookings />}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1, minWidth: 0 },
  mt6: { marginTop: 6 },
  mt12: { marginTop: 12 },
  capitalize: { textTransform: 'capitalize' },
  tabs: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.md, paddingTop: 12, paddingBottom: 4 },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  tabActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  tabText: { fontSize: 12, fontWeight: '700', color: '#525252' },
  tabTextActive: { color: colors.white },
  list: { padding: spacing.md, gap: 10 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 14, fontWeight: '700', color: colors.foreground, flexShrink: 1 },
  provider: { fontSize: 12, color: '#525252', marginTop: 4 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: spacing.sm },
  routeText: { flex: 1, fontSize: 12, color: colors.mutedForeground, marginTop: 4 },
  typeText: { fontSize: 11, color: colors.mutedForeground, fontWeight: '600' },
  amount: { fontSize: 12, fontWeight: '800', color: colors.primary },
  active: {
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stageText: { fontSize: 12, color: '#525252' },
  otpCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: '#FBF6EC',
    borderRadius: radius.md,
    padding: 12,
  },
  otpLabel: { fontSize: 12, fontWeight: '700', color: colors.accentForeground },
  otpCode: { fontSize: 20, fontWeight: '800', letterSpacing: 6, color: colors.foreground },
  otpHint: { fontSize: 11, color: '#525252', marginTop: 4 },
  tracking: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  trackingMap: { height: 176 },
  trackingFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    padding: 10,
  },
  trackingText: { fontSize: 11, color: colors.mutedForeground },
  mapLink: { fontSize: 11, fontWeight: '700', color: colors.primary },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    borderRadius: radius.md,
    paddingVertical: 11,
  },
  callText: { fontSize: 14, fontWeight: '700', color: colors.white },
});
