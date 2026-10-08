import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CheckCircle2, Map as MapIcon, MapPin, Navigation, Phone, Route } from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { ErrorView, LoadingView } from '../../../components/StateViews';
import { MapEmbed } from '../../../components/map/MapEmbed';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { watchLocation, type LatLng } from '../../../services/location';
import { directionsUrl, distanceKm } from '../../../utils/geo';
import { money } from '../../../utils/format';
import type { AppStackParamList } from '../../../navigation/types';
import { TripControls } from '../components/TripControls';
import type { TransportRequest, TripStage } from '../types';

type Rt = RouteProp<AppStackParamList, 'Trip'>;

// While the trip is moving, the transporter's position is sent to the user this often.
const LOCATION_PUSH_MS = 20000;

const STAGES: { key: TripStage; label: string }[] = [
  { key: 'scheduled', label: 'Accepted' },
  { key: 'to_pickup', label: 'To pickup' },
  { key: 'in_transit', label: 'In transit' },
  { key: 'delivered', label: 'Delivered' },
];

function StageStepper({ stage }: { stage?: TripStage }) {
  const current = STAGES.findIndex(s => s.key === stage);
  return (
    <View style={styles.stepper}>
      {STAGES.map((s, i) => {
        const done = i <= current;
        return (
          <View key={s.key} style={styles.step}>
            <View style={styles.stepRow}>
              <View style={[styles.stepLine, i === 0 && styles.hidden, i <= current && styles.stepLineDone]} />
              <View style={[styles.stepDot, done && styles.stepDotDone]}>
                <Text style={[styles.stepNum, done && styles.stepNumDone]}>{i + 1}</Text>
              </View>
              <View style={[styles.stepLine, i === STAGES.length - 1 && styles.hidden, i < current && styles.stepLineDone]} />
            </View>
            <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{s.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function OtpStep({
  title,
  hint,
  value,
  onChange,
  onSubmit,
  busy,
  cta,
}: {
  title: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  cta: string;
}) {
  return (
    <View style={[styles.card, styles.gap12]}>
      <View style={styles.inline}>
        <MapIcon color={colors.primary} size={16} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.muted}>{hint}</Text>
      <TextInput
        value={value}
        onChangeText={t => onChange(t.replace(/\D/g, '').slice(0, 4))}
        keyboardType="number-pad"
        maxLength={4}
        placeholder="4-digit OTP"
        placeholderTextColor={colors.mutedForeground}
        style={styles.otpInput}
      />
      <Pressable
        style={[styles.goldBtn, (busy || value.length !== 4) && styles.disabled]}
        disabled={busy || value.length !== 4}
        onPress={onSubmit}>
        <Text style={styles.goldBtnText}>{busy ? 'Verifying...' : cta}</Text>
      </Pressable>
    </View>
  );
}

export function TripScreen() {
  const { params } = useRoute<Rt>();
  const id = params.requestId;
  const [request, setRequest] = useState<TransportRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState('');
  const [here, setHere] = useState<LatLng | null>(null);
  const latestHere = useRef<LatLng | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ request: TransportRequest }>(`/transport/requests/${id}`);
      setRequest(data.request);
    } catch (e: any) {
      setError(e.message || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const stage = request?.stage;
  const tracking = request?.status === 'accepted' && (stage === 'to_pickup' || stage === 'in_transit');
  const target = stage === 'to_pickup' ? request?.source : stage === 'in_transit' ? request?.destination : null;

  // Share the transporter's live position with the user while the trip is active.
  useEffect(() => {
    if (!tracking) return;
    const stopWatching = watchLocation(
      point => {
        latestHere.current = point;
        setHere(point);
      },
      () => setError('Allow location access so the user can track you.'),
    );
    const pusher = setInterval(() => {
      if (!latestHere.current) return;
      apiFetch(`/transport/requests/${id}/location`, { method: 'POST', body: latestHere.current }).catch(() => {});
    }, LOCATION_PUSH_MS);
    return () => {
      stopWatching();
      clearInterval(pusher);
    };
  }, [tracking, id]);

  const runAction = async (body: object) => {
    setBusy(true);
    setError('');
    try {
      const data = await apiFetch<{ request: TransportRequest }>(`/transport/requests/${id}/stage`, { method: 'PATCH', body });
      setRequest(data.request);
      setOtp('');
    } catch (e: any) {
      setError(e.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const header = (
    <NavyHeader
      title="Booking details"
      titleSize={17}
      subtitle={request ? (request.type === 'shared' ? 'Shared ride' : 'Private transport') : undefined}
    />
  );

  if (loading || !request) {
    return (
      <Screen style={styles.noPadding} topColor={colors.navy}>
        {header}
        {loading ? <LoadingView /> : <ErrorView message={error || 'Booking not found'} />}
      </Screen>
    );
  }

  const user = request.user || { name: undefined, phone: undefined };
  const distance = here && target ? distanceKm(here, target) : null;
  const mapPoint = target || request.source;
  const finished = request.status === 'completed';

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      {header}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {request.status === 'accepted' || finished ? (
          <View style={styles.card}>
            <StageStepper stage={finished ? 'delivered' : stage} />
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={[styles.card, styles.userRow]}>
          <View style={styles.flex}>
            <Text style={styles.kicker}>USER</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user.name || 'User'}
            </Text>
            <Text style={styles.muted}>{user.phone}</Text>
          </View>
          {user.phone ? (
            <Pressable style={styles.callBtn} onPress={() => Linking.openURL(`tel:${user.phone}`)}>
              <Phone color={colors.white} size={16} />
              <Text style={styles.callText}>Call</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={[styles.card, styles.gap12]}>
          <View style={styles.point}>
            <View style={styles.dotStart} />
            <View style={styles.flex}>
              <Text style={styles.kicker}>PICKUP</Text>
              <Text style={styles.body}>{request.source.address}</Text>
            </View>
          </View>
          <View style={styles.point}>
            <MapPin color="#F43F5E" size={16} />
            <View style={styles.flex}>
              <Text style={styles.kicker}>DROP-OFF</Text>
              <Text style={styles.body}>{request.destination.address}</Text>
            </View>
          </View>
          <View style={styles.figures}>
            <View style={styles.figure}>
              <Text style={styles.figureLabel}>Trip</Text>
              <Text style={styles.figureValue}>{request.quote?.tripKm} km</Text>
            </View>
            <View style={styles.figure}>
              <Text style={styles.figureLabel}>Rate</Text>
              <Text style={styles.figureValue}>₹{request.quote?.pricePerKm}/km</Text>
            </View>
            <View style={styles.figure}>
              <Text style={styles.figureLabel}>Amount</Text>
              <Text style={[styles.figureValue, styles.gold]}>{money(request.quote?.amount)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.mapCard}>
          <MapEmbed lat={mapPoint.lat} lng={mapPoint.lng} style={styles.map} />
          <View style={styles.mapFoot}>
            <Text style={[styles.muted, styles.flex]}>
              {target
                ? distance != null
                  ? `${distance.toFixed(1)} km to ${stage === 'to_pickup' ? 'pickup' : 'drop-off'}`
                  : 'Locating you...'
                : 'Map shows the pickup point'}
            </Text>
            <Pressable style={styles.navigateBtn} onPress={() => Linking.openURL(directionsUrl(mapPoint.lat, mapPoint.lng))}>
              <Navigation color={colors.white} size={14} />
              <Text style={styles.navigateText}>Navigate</Text>
            </Pressable>
          </View>
        </View>

        {request.sharedRun ? (
          <View style={[styles.card, styles.gap8]}>
            <Text style={styles.cardTitle}>Shared run · {request.sharedRun.animalsTotal} animal(s) in total</Text>
            <Text style={styles.small}>Stops run in booking order. Each drop-off waits for the earlier one.</Text>
            {request.sharedRun.stops.map(s => (
              <View key={String(s.requestId)} style={[styles.stop, s.isThis && styles.stopThis]}>
                <Text style={styles.stopTitle}>
                  {s.position}. {s.animals} animal(s){s.isThis ? <Text style={styles.gold}> · this booking</Text> : null}
                </Text>
                <Text style={styles.stopText}>Pick up: {s.pickup.address}</Text>
                <Text style={styles.stopText}>Drop: {s.drop.address}</Text>
                <Text style={styles.stopStatus}>
                  {s.delivered ? 'Delivered' : s.picked ? 'On board' : s.status === 'accepted' ? 'Waiting for pickup' : s.status}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {request.status === 'accepted' && !finished && stage !== 'delivered' ? (
          <TripControls request={request} onUpdated={load} />
        ) : null}

        {request.status === 'accepted' && stage === 'scheduled' ? (
          <Pressable style={[styles.startBtn, busy && styles.disabled]} disabled={busy} onPress={() => runAction({ action: 'start' })}>
            <Route color={colors.white} size={16} />
            <Text style={styles.goldBtnText}>Start trip to pickup</Text>
          </Pressable>
        ) : null}

        {request.status === 'accepted' && stage === 'to_pickup' ? (
          <OtpStep
            title="Reached the user?"
            hint="Ask the user for the pickup OTP shown in their app."
            value={otp}
            onChange={setOtp}
            onSubmit={() => runAction({ action: 'verify_pickup', otp })}
            busy={busy}
            cta="Verify pickup OTP"
          />
        ) : null}

        {request.status === 'accepted' && stage === 'in_transit' ? (
          <OtpStep
            title="Reached the drop-off?"
            hint="Ask the user for the delivery OTP to complete the trip."
            value={otp}
            onChange={setOtp}
            onSubmit={() => runAction({ action: 'verify_drop', otp })}
            busy={busy}
            cta="Verify delivery OTP"
          />
        ) : null}

        {finished ? (
          <View style={styles.done}>
            <CheckCircle2 color="#059669" size={32} />
            <Text style={styles.doneTitle}>Trip completed</Text>
            <View style={styles.settlement}>
              <View style={styles.settleRow}>
                <Text style={styles.settleText}>Booking amount</Text>
                <Text style={styles.settleText}>{money(request.settlement?.grossAmount ?? request.quote?.amount)}</Text>
              </View>
              <View style={styles.settleRow}>
                <Text style={styles.settleText}>Platform commission</Text>
                <Text style={styles.settleText}>− {money(request.settlement?.commission)}</Text>
              </View>
              <View style={[styles.settleRow, styles.settleTotal]}>
                <Text style={styles.settleBold}>Credited to your wallet</Text>
                <Text style={styles.settleBold}>{money(request.settlement?.netAmount)}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {request.status === 'pending' ? (
          <Text style={styles.pendingNote}>Accept this booking from the Home tab to start the trip.</Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1, minWidth: 0 },
  hidden: { opacity: 0 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  gap8: { gap: spacing.sm },
  gap12: { gap: 12 },
  disabled: { opacity: 0.5 },
  gold: { color: colors.primary },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.lg },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  stepper: { flexDirection: 'row', paddingHorizontal: 4 },
  step: { flex: 1, alignItems: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border },
  stepLineDone: { backgroundColor: '#10B981' },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: '#10B981' },
  stepNum: { fontSize: 10, fontWeight: '700', color: colors.mutedForeground },
  stepNumDone: { color: colors.white },
  stepLabel: { fontSize: 10, fontWeight: '600', color: '#A3A3A3', marginTop: 4, textAlign: 'center' },
  stepLabelDone: { color: colors.foreground },
  error: { fontSize: 12, color: colors.destructive },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kicker: { fontSize: 11, letterSpacing: 0.4, color: colors.mutedForeground },
  userName: { fontSize: 16, fontWeight: '700', color: colors.foreground },
  muted: { fontSize: 12, color: colors.mutedForeground },
  small: { fontSize: 11, color: colors.mutedForeground },
  callBtn: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.md,
    backgroundColor: '#059669',
    paddingHorizontal: spacing.md,
  },
  callText: { fontSize: 14, fontWeight: '700', color: colors.white },
  point: { flexDirection: 'row', gap: 12 },
  dotStart: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#10B981', backgroundColor: colors.white, marginTop: 4 },
  body: { fontSize: 13, color: colors.foreground },
  figures: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  figure: { flex: 1, alignItems: 'center' },
  figureLabel: { fontSize: 11, color: colors.mutedForeground },
  figureValue: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  mapCard: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  map: { height: 224 },
  mapFoot: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: 12 },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.md,
    backgroundColor: colors.navy,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navigateText: { fontSize: 12, fontWeight: '700', color: colors.white },
  stop: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 12 },
  stopThis: { borderColor: colors.primary, backgroundColor: '#FBEFD6' },
  stopTitle: { fontSize: 12, fontWeight: '700', color: colors.foreground },
  stopText: { fontSize: 12, color: '#525252' },
  stopStatus: { fontSize: 11, fontWeight: '600', color: colors.mutedForeground, marginTop: 4 },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    paddingVertical: 14,
  },
  goldBtn: { borderRadius: radius.md, backgroundColor: colors.primary, paddingVertical: 12, alignItems: 'center' },
  goldBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },
  otpInput: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 8,
    color: colors.foreground,
  },
  done: {
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    padding: spacing.lg,
  },
  doneTitle: { fontSize: 16, fontWeight: '700', color: colors.foreground },
  settlement: { width: '100%', gap: 4, marginTop: 4, borderRadius: radius.md, backgroundColor: colors.card, padding: 12 },
  settleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  settleText: { fontSize: 12, color: '#525252' },
  settleTotal: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 4 },
  settleBold: { fontSize: 12, fontWeight: '700', color: colors.foreground },
  pendingNote: {
    borderRadius: radius.lg,
    backgroundColor: colors.muted,
    padding: spacing.md,
    textAlign: 'center',
    fontSize: 12,
    color: '#525252',
    overflow: 'hidden',
  },
});
