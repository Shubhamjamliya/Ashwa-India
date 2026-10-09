import React, { useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, MapPin, Phone, Truck, Users, XCircle } from 'lucide-react-native';
import { colors, radius, spacing } from '../../../theme/colors';
import { money } from '../../../utils/format';
import { getMediaUrl } from '../../../services/media';
import type { TransportPoint, TransportRequest } from '../../trips/types';

export const dateLabel = (d?: string) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : null;

export function RouteLines({ source, destination }: { source: TransportPoint; destination: TransportPoint }) {
  return (
    <View style={styles.route}>
      <View style={styles.routeRail}>
        <View style={styles.dotStart} />
        <View style={styles.routeLine} />
        <MapPin color="#F43F5E" size={12} />
      </View>
      <View style={styles.routeText}>
        <Text style={styles.address}>{source.address}</Text>
        <Text style={styles.address}>{destination.address}</Text>
      </View>
    </View>
  );
}

// A new booking request shown in full, so the transporter can decide from the card itself.
export function EnquiryCard({
  req,
  busy,
  onRespond,
}: {
  req: TransportRequest;
  busy: boolean;
  onRespond: (id: string, action: 'accept' | 'reject') => Promise<void>;
}) {
  const [error, setError] = useState('');
  const host = req.hostRequest;
  const shared = Boolean(host);
  const open = !req.transporter;
  const advance = req.advance?.status === 'paid' ? req.advance.amount || 0 : 0;
  const fare = req.quote?.amount || 0;

  const respond = async (action: 'accept' | 'reject') => {
    setError('');
    try {
      await onRespond(req._id, action);
    } catch (e: any) {
      setError(e.message || 'Could not update the request');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={[styles.typeChip, shared ? styles.sharedChip : styles.privateChip]}>
          {shared ? <Users color="#1E40AF" size={11} /> : <Truck color="#92400E" size={11} />}
          <Text style={[styles.typeText, shared ? styles.sharedText : styles.privateText]}>
            {shared ? 'Shared ride request' : 'Private transport'}
          </Text>
        </View>
        {open ? <Text style={styles.openChip}>First to accept gets it</Text> : null}
        <Text style={styles.time}>
          {new Date(req.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.userRow}>
          <Text style={styles.user} numberOfLines={1}>
            {req.user?.name || req.user?.phone || 'Customer'}
          </Text>
          {req.user?.phone ? (
            <Pressable style={styles.inline} onPress={() => Linking.openURL(`tel:${req.user?.phone}`)} hitSlop={6}>
              <Phone color={colors.primary} size={12} />
              <Text style={styles.callText}>Call</Text>
            </Pressable>
          ) : null}
        </View>

        {req.vehicleTypeInfo ? (
          <View style={styles.vehicleRow}>
            <View style={styles.vehicleIcon}>
              {req.vehicleTypeInfo.icon ? (
                <Image source={{ uri: getMediaUrl(req.vehicleTypeInfo.icon) }} style={styles.fill} resizeMode="contain" />
              ) : (
                <Truck color={colors.primary} size={16} />
              )}
            </View>
            <Text style={styles.vehicleName}>{req.vehicleTypeInfo.name}</Text>
          </View>
        ) : null}

        <RouteLines source={req.source} destination={req.destination} />

        <View style={styles.facts}>
          {(
            [
              ['Travel date', dateLabel(req.scheduledDate) || 'Flexible'],
              ['Animals', String(req.animals || 1)],
              ['Distance', `${req.quote?.tripKm ?? '—'} km`],
            ] as const
          ).map(([label, value]) => (
            <View key={label} style={styles.fact}>
              <Text style={styles.factLabel}>{label}</Text>
              <Text style={styles.factValue}>{value}</Text>
            </View>
          ))}
        </View>

        {host ? (
          <View style={styles.hostBox}>
            <Text style={styles.hostTitle}>Joins your accepted booking on {dateLabel(host.scheduledDate)}</Text>
            <Text style={styles.hostText}>
              {host.source?.address} → {host.destination?.address} · {host.animals || 1} animal(s) already booked
            </Text>
            <Text style={styles.hostText}>The first customer agreed to share. Accepting splits the fare between both customers.</Text>
          </View>
        ) : null}

        <View style={styles.money}>
          <View style={styles.moneyRow}>
            <Text style={styles.moneyLabel}>{shared ? "Customer's share" : 'Fare'}</Text>
            <Text style={styles.moneyStrong}>{money(fare)}</Text>
          </View>
          <View style={styles.moneyRow}>
            <Text style={styles.moneyLabel}>Advance paid</Text>
            <Text style={[styles.moneyValue, styles.paidText]}>{money(advance)}</Text>
          </View>
          <View style={styles.moneyRow}>
            <Text style={styles.moneyLabel}>Due at delivery</Text>
            <Text style={styles.moneyValue}>{money(Math.max(0, fare - advance))}</Text>
          </View>
        </View>

        {req.message ? <Text style={styles.message}>"{req.message}"</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          <Pressable style={[styles.actionBtn, styles.declineBtn, busy && styles.faded]} disabled={busy} onPress={() => respond('reject')}>
            <XCircle color={colors.foreground} size={16} />
            <Text style={styles.declineText}>Decline</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.acceptBtn, busy && styles.faded]} disabled={busy} onPress={() => respond('accept')}>
            <CheckCircle2 color={colors.white} size={16} />
            <Text style={styles.acceptText}>Accept</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  faded: { opacity: 0.6 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  card: { overflow: 'hidden', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: '#FBF6EC',
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
  },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  sharedChip: { backgroundColor: '#DBEAFE' },
  privateChip: { backgroundColor: '#FEF3C7' },
  typeText: { fontSize: 10, fontWeight: '700' },
  sharedText: { color: '#1E40AF' },
  privateText: { color: '#92400E' },
  paidText: { color: '#047857' },
  time: { fontSize: 10, fontWeight: '600', color: colors.mutedForeground },
  openChip: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
    backgroundColor: '#D1FAE5',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  fill: { width: '100%', height: '100%' },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.md, backgroundColor: colors.muted, padding: 6 },
  vehicleIcon: {
    width: 28,
    height: 28,
    overflow: 'hidden',
    borderRadius: 6,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleName: { fontSize: 12, fontWeight: '700', color: colors.foreground },
  body: { padding: spacing.md, gap: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  user: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.foreground },
  callText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  route: { flexDirection: 'row', gap: 12 },
  routeRail: { alignItems: 'center', paddingTop: 4 },
  dotStart: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#10B981', backgroundColor: colors.white },
  routeLine: { width: 1, flex: 1, minHeight: 10, marginVertical: 2, backgroundColor: colors.border },
  routeText: { flex: 1, minWidth: 0, gap: spacing.sm },
  address: { fontSize: 12, color: '#525252' },
  facts: { flexDirection: 'row', gap: spacing.sm },
  fact: { flex: 1, alignItems: 'center', borderRadius: radius.md, backgroundColor: colors.muted, paddingVertical: 6, paddingHorizontal: 4 },
  factLabel: { fontSize: 10, fontWeight: '600', color: colors.mutedForeground },
  factValue: { fontSize: 12, fontWeight: '700', color: colors.foreground },
  hostBox: { borderRadius: radius.md, borderWidth: 1, borderColor: '#DBEAFE', backgroundColor: '#EFF6FF', padding: 10, gap: 2 },
  hostTitle: { fontSize: 11, fontWeight: '700', color: '#1E3A8A' },
  hostText: { fontSize: 11, color: '#1E40AF' },
  money: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 10, gap: 4 },
  moneyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moneyLabel: { fontSize: 12, color: colors.mutedForeground },
  moneyStrong: { fontSize: 12, fontWeight: '800', color: colors.foreground },
  moneyValue: { fontSize: 12, fontWeight: '700', color: colors.foreground },
  message: { fontSize: 12, color: '#404040', backgroundColor: colors.muted, borderRadius: radius.md, padding: 10 },
  error: { fontSize: 12, color: colors.destructive },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: radius.md, paddingVertical: 10 },
  declineBtn: { backgroundColor: colors.muted },
  declineText: { fontSize: 13, fontWeight: '700', color: colors.foreground },
  acceptBtn: { backgroundColor: colors.primary },
  acceptText: { fontSize: 13, fontWeight: '700', color: colors.white },
});
