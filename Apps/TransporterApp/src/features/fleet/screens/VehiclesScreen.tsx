import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Pencil, Plus, Trash2, Truck, X } from 'lucide-react-native';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { LoadingView } from '../../../components/StateViews';
import { ExpiryDateField } from '../../../components/ExpiryDateField';
import { Checkbox, FieldLabel, TextField, UploadChip } from '../../../components/FormControls';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getMediaUrl } from '../../../services/media';
import { choosePhotos, uploadPhoto } from '../../../services/images';
import { useVehicleTypes } from '../../../services/vehicleTypes';
import type { Vehicle, VehicleType } from '../types';

const DOCS = [
  { key: 'registrationCertificate', label: 'Registration certificate' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'fitness', label: 'Fitness certificate' },
] as const;

type DocKey = (typeof DOCS)[number]['key'];
type DocState = Partial<Record<DocKey, { url?: string; expiresAt?: string }>>;

function VehicleForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: Vehicle | null;
  onCancel: () => void;
  onSaved: (vehicle: Vehicle, wasEdit: boolean) => void;
}) {
  const { types } = useVehicleTypes();
  const [vehicleType, setVehicleType] = useState<VehicleType>(initial?.vehicleType || '');
  const [registrationNumber, setRegistrationNumber] = useState(initial?.registrationNumber || '');
  const [capacityKg, setCapacityKg] = useState(initial?.capacityKg != null ? String(initial.capacityKg) : '');
  const [compartments, setCompartments] = useState(String(initial?.compartments ?? 1));
  const [maxAnimals, setMaxAnimals] = useState(String(initial?.maxAnimals ?? 1));
  const [dedicated, setDedicated] = useState(initial?.dedicated ?? true);
  const [shared, setShared] = useState(initial?.shared ?? false);
  const [images, setImages] = useState<string[]>(initial?.images || []);
  const [documents, setDocuments] = useState<DocState>(() =>
    Object.fromEntries(
      Object.entries(initial?.documents || {}).map(([k, d]) => [k, { url: d?.url, expiresAt: d?.expiresAt ? d.expiresAt.slice(0, 10) : '' }]),
    ),
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addImages = async () => {
    setError('');
    try {
      const picked = await choosePhotos({ multiple: true });
      if (!picked.length) return;
      setUploading(true);
      for (const photo of picked) {
        const url = await uploadPhoto(photo);
        setImages(prev => [...prev, url]);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const addDoc = async (key: DocKey) => {
    setError('');
    try {
      const [photo] = await choosePhotos();
      if (!photo) return;
      setUploading(true);
      const url = await uploadPhoto(photo);
      setDocuments(prev => ({ ...prev, [key]: { ...(prev[key] || {}), url } }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!vehicleType) {
      setError('Select a vehicle type');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const docs = Object.fromEntries(
        DOCS.filter(d => documents[d.key]?.url).map(d => [
          d.key,
          { url: documents[d.key]!.url, expiresAt: documents[d.key]!.expiresAt || undefined },
        ]),
      );
      const body = {
        vehicleType,
        registrationNumber,
        capacityKg: capacityKg === '' ? undefined : Number(capacityKg),
        compartments: Number(compartments) || 1,
        maxAnimals: Number(maxAnimals) || 1,
        dedicated,
        shared,
        images,
        documents: docs,
      };
      const data = initial
        ? await apiFetch<{ vehicle: Vehicle }>(`/transporter-ops/vehicles/${initial._id}`, { method: 'PATCH', body })
        : await apiFetch<{ vehicle: Vehicle }>('/transporter-ops/vehicles', { method: 'POST', body });
      onSaved(data.vehicle, Boolean(initial));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.form}>
      <View style={styles.formHead}>
        <Text style={styles.formTitle}>{initial ? 'Edit vehicle' : 'Add vehicle'}</Text>
        <Pressable onPress={onCancel} hitSlop={10}>
          <X color={colors.mutedForeground} size={16} />
        </Pressable>
      </View>

      <View>
        <FieldLabel>Vehicle type</FieldLabel>
        {types.length === 0 ? (
          <Text style={styles.empty}>Loading vehicle types...</Text>
        ) : (
          <View style={styles.typeGrid}>
            {types.map(t => {
              const active = vehicleType === t.key;
              return (
                <Pressable key={t.key} style={[styles.typeTile, active && styles.typeTileActive]} onPress={() => setVehicleType(t.key)}>
                  <View style={styles.typeIcon}>
                    {t.icon ? (
                      <Image source={{ uri: getMediaUrl(t.icon) }} style={styles.fill} resizeMode="contain" />
                    ) : (
                      <Truck color={colors.primary} size={20} />
                    )}
                  </View>
                  <Text style={styles.typeName} numberOfLines={2}>
                    {t.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
      <TextField
        label="Registration number"
        value={registrationNumber}
        onChangeText={setRegistrationNumber}
        autoCapitalize="characters"
        placeholder="RJ14 AB 1234"
      />
      <View style={styles.row3}>
        <TextField
          label="Capacity (kg)"
          style={styles.flex}
          keyboardType="number-pad"
          value={capacityKg}
          onChangeText={t => setCapacityKg(t.replace(/\D/g, ''))}
        />
        <TextField
          label="Compartments"
          style={styles.flex}
          keyboardType="number-pad"
          value={compartments}
          onChangeText={t => setCompartments(t.replace(/\D/g, ''))}
        />
        <TextField
          label="Max animals"
          style={styles.flex}
          keyboardType="number-pad"
          value={maxAnimals}
          onChangeText={t => setMaxAnimals(t.replace(/\D/g, ''))}
        />
      </View>
      <View style={styles.checks}>
        <Checkbox checked={dedicated} onChange={setDedicated} label="Dedicated" />
        <Checkbox checked={shared} onChange={setShared} label="Shared" />
      </View>

      <View>
        <FieldLabel>Vehicle photos</FieldLabel>
        <View style={styles.photos}>
          {images.map((u, i) => (
            <View key={u + i} style={styles.photo}>
              <Image source={{ uri: getMediaUrl(u) }} style={styles.fill} />
              <Pressable style={styles.photoRemove} onPress={() => setImages(images.filter((_, j) => j !== i))} hitSlop={6}>
                <X color={colors.white} size={12} />
              </Pressable>
            </View>
          ))}
          <Pressable style={[styles.photoAdd, uploading && styles.disabled]} disabled={uploading} onPress={addImages}>
            {uploading ? <ActivityIndicator size="small" color={colors.primary} /> : <Plus color={colors.primary} size={20} />}
          </Pressable>
        </View>
      </View>

      <View style={styles.gap8}>
        <FieldLabel>Documents (photo) and expiry</FieldLabel>
        {DOCS.map(d => {
          const doc = documents[d.key] || {};
          return (
            <View key={d.key} style={styles.docRow}>
              <View style={styles.flex}>
                <Text style={styles.docTitle}>{d.label}</Text>
                <Text style={styles.docState}>{doc.url ? 'Uploaded' : 'Not uploaded'}</Text>
              </View>
              <ExpiryDateField
                compact
                value={doc.expiresAt || ''}
                placeholder="Expiry"
                onChange={v => setDocuments(prev => ({ ...prev, [d.key]: { ...doc, expiresAt: v } }))}
                style={styles.expiry}
              />
              <UploadChip label="Upload" onPress={() => addDoc(d.key)} disabled={uploading} />
            </View>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={[styles.submit, (saving || uploading) && styles.disabled]} disabled={saving || uploading} onPress={submit}>
        <Text style={styles.submitText}>{saving ? 'Saving...' : initial ? 'Save vehicle' : 'Add vehicle'}</Text>
      </Pressable>
    </View>
  );
}

// The transporter's fleet: vehicles, their documents and whether each is free or on a trip.
export function VehiclesScreen() {
  const { labelOf, iconOf } = useVehicleTypes();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{ vehicles: Vehicle[] }>('/transporter-ops/vehicles')
      .then(d => setVehicles(d.vehicles || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const onSaved = (vehicle: Vehicle, wasEdit: boolean) => {
    setVehicles(prev => (wasEdit ? prev.map(v => (v._id === vehicle._id ? vehicle : v)) : [vehicle, ...prev]));
    setEditing(null);
    setAdding(false);
  };

  const remove = (v: Vehicle) =>
    Alert.alert(`Remove ${v.registrationNumber}?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/transporter-ops/vehicles/${v._id}`, { method: 'DELETE' });
            setVehicles(prev => prev.filter(x => x._id !== v._id));
          } catch (e: any) {
            setError(e.message);
          }
        },
      },
    ]);

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title="Vehicles" subtitle="Your fleet, documents and availability" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {adding || editing ? (
            <VehicleForm
              key={editing?._id || 'new'}
              initial={editing}
              onCancel={() => {
                setAdding(false);
                setEditing(null);
              }}
              onSaved={onSaved}
            />
          ) : (
            <Pressable style={styles.addBtn} onPress={() => setAdding(true)}>
              <Plus color={colors.primary} size={16} />
              <Text style={styles.addText}>Add vehicle</Text>
            </Pressable>
          )}

          {loading ? (
            <LoadingView compact />
          ) : vehicles.length === 0 && !adding ? (
            <Text style={styles.empty}>No vehicles yet. Add your first vehicle.</Text>
          ) : (
            vehicles.map(v => (
              <View key={v._id} style={styles.item}>
                <View style={styles.thumb}>
                  {v.images?.[0] ? (
                    <Image source={{ uri: getMediaUrl(v.images[0]) }} style={styles.fill} />
                  ) : iconOf(v.vehicleType) ? (
                    <Image source={{ uri: getMediaUrl(iconOf(v.vehicleType)) }} style={styles.fill} resizeMode="contain" />
                  ) : (
                    <Truck color="#A3A3A3" size={24} />
                  )}
                </View>
                <View style={styles.flex}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {v.registrationNumber}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {labelOf(v.vehicleType)} · {v.maxAnimals} animal{v.maxAnimals === 1 ? '' : 's'}
                  </Text>
                  <View style={styles.tags}>
                    {v.dedicated ? <Text style={[styles.tag, styles.tagAmber]}>Dedicated</Text> : null}
                    {v.shared ? <Text style={[styles.tag, styles.tagBlue]}>Shared</Text> : null}
                    <Text style={[styles.tag, v.isAvailable ? styles.tagGreen : styles.tagGrey]}>
                      {v.isAvailable ? 'Available' : 'On trip'}
                    </Text>
                  </View>
                </View>
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    setAdding(false);
                    setEditing(v);
                  }}>
                  <Pencil color="#525252" size={16} />
                </Pressable>
                <Pressable hitSlop={8} onPress={() => remove(v)}>
                  <Trash2 color="#E11D48" size={16} />
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeTile: {
    width: '31%',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.sm,
  },
  typeTileActive: { borderColor: colors.primary, backgroundColor: '#FBF6EC' },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeName: { fontSize: 11, fontWeight: '600', color: colors.foreground, textAlign: 'center' },
  noPadding: { padding: 0 },
  flex: { flex: 1, minWidth: 0 },
  fill: { width: '100%', height: '100%' },
  gap8: { gap: spacing.sm },
  disabled: { opacity: 0.5 },
  content: { gap: 12, padding: spacing.md, paddingBottom: spacing.lg },
  error: { fontSize: 12, color: colors.destructive },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.card,
    paddingVertical: 12,
  },
  addText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  empty: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', paddingVertical: 40 },
  form: { gap: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: spacing.md },
  formHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  formTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  row3: { flexDirection: 'row', gap: spacing.sm },
  checks: { flexDirection: 'row', gap: spacing.md },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photo: { width: 64, height: 64, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.muted },
  photoRemove: { position: 'absolute', top: 2, right: 2, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 2 },
  photoAdd: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  docTitle: { fontSize: 12, fontWeight: '700', color: colors.foreground },
  docState: { fontSize: 10, color: colors.mutedForeground },
  expiry: { width: 92 },
  submit: { borderRadius: radius.md, backgroundColor: colors.primary, paddingVertical: 12, alignItems: 'center' },
  submitText: { fontSize: 14, fontWeight: '700', color: colors.white },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  itemMeta: { fontSize: 11, color: colors.mutedForeground },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  tag: { fontSize: 10, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full, overflow: 'hidden' },
  tagAmber: { backgroundColor: '#FEF3C7', color: '#92400E' },
  tagBlue: { backgroundColor: '#DBEAFE', color: '#1E40AF' },
  tagGreen: { backgroundColor: '#D1FAE5', color: '#065F46' },
  tagGrey: { backgroundColor: '#E5E5E5', color: '#525252' },
});
