import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, Pause, Play } from 'lucide-react-native';
import { SelectField, DateField } from '../../../components/SelectField';
import { FieldLabel, TextField } from '../../../components/FormControls';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { choosePhotos, uploadPhoto } from '../../../services/images';
import type { Driver, Vehicle } from '../../fleet/types';
import type { TransportRequest } from '../types';

const idOf = (ref: TransportRequest['vehicle']) => (ref && typeof ref === 'object' ? ref._id : ref || '');

// Transporter-side controls for one accepted booking: vehicle and driver, pickup schedule,
// pause/resume and delivery proof. Hidden once the trip is delivered.
export function TripControls({ request, onUpdated }: { request: TransportRequest; onUpdated: () => void }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicleId, setVehicleId] = useState(idOf(request.vehicle));
  const [driverId, setDriverId] = useState(idOf(request.driver));
  const [when, setWhen] = useState(request.pickupScheduledAt || '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    Promise.allSettled([
      apiFetch<{ vehicles: Vehicle[] }>('/transporter-ops/vehicles'),
      apiFetch<{ drivers: Driver[] }>('/transporter-ops/drivers'),
    ]).then(([v, d]) => {
      if (v.status === 'fulfilled') setVehicles(v.value.vehicles || []);
      if (d.status === 'fulfilled') setDrivers(d.value.drivers || []);
    });
  }, []);

  const run = async (fn: () => Promise<unknown>, message?: string) => {
    setBusy(true);
    setError('');
    setOk('');
    try {
      await fn();
      onUpdated();
      if (message) setOk(message);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const assign = () =>
    run(
      () =>
        apiFetch(`/transport/requests/${request._id}/assign`, { method: 'PATCH', body: { vehicleId, driverId } }),
      'Vehicle and driver saved.',
    );

  const schedule = () =>
    run(
      () =>
        apiFetch(`/transport/requests/${request._id}/schedule`, {
          method: 'PATCH',
          body: { pickupScheduledAt: new Date(when).toISOString() },
        }),
      'Pickup time saved.',
    );

  const togglePause = () =>
    run(
      () => apiFetch(`/transport/requests/${request._id}/pause`, { method: 'PATCH', body: { paused: !request.paused } }),
      request.paused ? 'Trip resumed.' : 'Trip paused. The user sees it as paused.',
    );

  const uploadProof = async () => {
    setError('');
    setOk('');
    try {
      const [photo] = await choosePhotos();
      if (!photo) return;
      setBusy(true);
      const url = await uploadPhoto(photo);
      await apiFetch(`/transport/requests/${request._id}/proof`, {
        method: 'POST',
        body: { url, note: note.trim() || undefined },
      });
      onUpdated();
      setNote('');
      setOk('Delivery proof uploaded.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const locked = request.stage === 'to_pickup' || request.stage === 'in_transit';
  const canProof = request.stage === 'in_transit';
  const vehicleOptions = vehicles
    .filter(v => v.isAvailable || v._id === vehicleId)
    .map(v => ({ value: v._id, label: `${v.registrationNumber} · ${v.maxAnimals} animal(s)` }));
  const driverOptions = drivers.filter(d => d.isAvailable || d._id === driverId).map(d => ({ value: d._id, label: d.name }));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Trip setup</Text>

      <View style={styles.gap8}>
        <FieldLabel>Vehicle</FieldLabel>
        <SelectField
          title="Choose a vehicle"
          placeholder="Choose a vehicle"
          value={vehicleId}
          options={vehicleOptions}
          onChange={setVehicleId}
          disabled={busy || locked}
        />
        <FieldLabel>Driver</FieldLabel>
        <SelectField
          title="Choose a driver"
          placeholder="Choose a driver"
          value={driverId}
          options={driverOptions}
          onChange={setDriverId}
          disabled={busy || locked}
        />
        {!locked ? (
          <Pressable
            style={[styles.navyBtn, (busy || !vehicleId || !driverId) && styles.disabled]}
            disabled={busy || !vehicleId || !driverId}
            onPress={assign}>
            <Text style={styles.navyText}>Save vehicle and driver</Text>
          </Pressable>
        ) : null}
      </View>

      {!locked ? (
        <View style={styles.gap8}>
          <FieldLabel>Pickup date and time</FieldLabel>
          <DateField value={when} onChange={setWhen} placeholder="Pickup date and time" withTime days={30} disabled={busy} />
          <Pressable style={[styles.outlineGold, (busy || !when) && styles.disabled]} disabled={busy || !when} onPress={schedule}>
            <Text style={styles.goldText}>Save pickup time</Text>
          </Pressable>
        </View>
      ) : null}

      {request.stage === 'scheduled' || locked ? (
        <Pressable style={[styles.outlineGrey, busy && styles.disabled]} disabled={busy} onPress={togglePause}>
          {request.paused ? <Play color="#262626" size={16} /> : <Pause color="#262626" size={16} />}
          <Text style={styles.greyText}>{request.paused ? 'Resume trip' : 'Pause trip'}</Text>
        </Pressable>
      ) : null}

      {canProof ? (
        <View style={[styles.gap8, styles.proof]}>
          <FieldLabel>Delivery proof (photo of the animal at drop-off)</FieldLabel>
          <TextField placeholder="Note (optional)" value={note} onChangeText={setNote} />
          <Pressable style={[styles.dashedGold, busy && styles.disabled]} disabled={busy} onPress={uploadProof}>
            <Camera color={colors.primary} size={16} />
            <Text style={styles.goldText}>{request.deliveryProof?.url ? 'Upload another photo' : 'Upload photo'}</Text>
          </Pressable>
          {request.deliveryProof?.url ? <Text style={styles.ok}>Proof on record.</Text> : null}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {ok ? <Text style={styles.ok}>{ok}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  title: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  gap8: { gap: spacing.sm },
  navyBtn: { borderRadius: radius.md, backgroundColor: colors.navy, paddingVertical: 10, alignItems: 'center' },
  navyText: { fontSize: 14, fontWeight: '700', color: colors.white },
  outlineGold: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary, paddingVertical: 10, alignItems: 'center' },
  goldText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  outlineGrey: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    paddingVertical: 10,
  },
  greyText: { fontSize: 14, fontWeight: '700', color: '#262626' },
  proof: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  dashedGold: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    paddingVertical: 10,
  },
  disabled: { opacity: 0.5 },
  error: { fontSize: 12, color: colors.destructive },
  ok: { fontSize: 12, color: '#047857' },
});
