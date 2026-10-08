import React, { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Pencil, Plus, Trash2, UserRound, X } from 'lucide-react-native';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { LoadingView } from '../../../components/StateViews';
import { ExpiryDateField } from '../../../components/ExpiryDateField';
import { TextField, UploadChip } from '../../../components/FormControls';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getMediaUrl } from '../../../services/media';
import { choosePhotos, uploadPhoto } from '../../../services/images';
import type { Driver } from '../types';

type PhotoKey = 'licenseImage' | 'idProofImage';

function DriverForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: Driver | null;
  onCancel: () => void;
  onSaved: (driver: Driver, wasEdit: boolean) => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    phone: initial?.phone || '',
    licenseNumber: initial?.licenseNumber || '',
    licenseExpiresAt: initial?.licenseExpiresAt ? initial.licenseExpiresAt.slice(0, 10) : '',
    licenseImage: initial?.licenseImage || '',
    idProofImage: initial?.idProofImage || '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const upload = async (key: PhotoKey) => {
    setError('');
    try {
      const [photo] = await choosePhotos();
      if (!photo) return;
      setUploading(true);
      set(key, await uploadPhoto(photo));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const body = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        licenseNumber: form.licenseNumber.trim() || undefined,
        licenseExpiresAt: form.licenseExpiresAt || undefined,
        licenseImage: form.licenseImage || '',
        idProofImage: form.idProofImage || '',
      };
      const data = initial
        ? await apiFetch<{ driver: Driver }>(`/transporter-ops/drivers/${initial._id}`, { method: 'PATCH', body })
        : await apiFetch<{ driver: Driver }>('/transporter-ops/drivers', { method: 'POST', body });
      onSaved(data.driver, Boolean(initial));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const photoRow = (key: PhotoKey, label: string) => (
    <View style={styles.docRow}>
      <View style={styles.flex}>
        <Text style={styles.docTitle}>{label}</Text>
        <Text style={styles.docState}>{form[key] ? 'Uploaded' : 'Not uploaded'}</Text>
      </View>
      <UploadChip label="Upload" onPress={() => upload(key)} disabled={uploading} />
    </View>
  );

  return (
    <View style={styles.form}>
      <View style={styles.formHead}>
        <Text style={styles.formTitle}>{initial ? 'Edit driver' : 'Add driver'}</Text>
        <Pressable onPress={onCancel} hitSlop={10}>
          <X color={colors.mutedForeground} size={16} />
        </Pressable>
      </View>
      <TextField placeholder="Full name" value={form.name} onChangeText={v => set('name', v)} />
      <TextField
        placeholder="Mobile number"
        keyboardType="number-pad"
        value={form.phone}
        onChangeText={v => set('phone', v.replace(/\D/g, '').slice(0, 10))}
      />
      <View style={styles.row2}>
        <TextField
          style={styles.flex}
          placeholder="Licence number"
          value={form.licenseNumber}
          onChangeText={v => set('licenseNumber', v)}
        />
        <ExpiryDateField
          style={styles.flex}
          placeholder="Licence expiry"
          value={form.licenseExpiresAt}
          onChange={v => set('licenseExpiresAt', v)}
        />
      </View>
      {photoRow('licenseImage', 'Driving licence photo')}
      {photoRow('idProofImage', 'ID proof photo')}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={[styles.submit, (saving || uploading) && styles.disabled]} disabled={saving || uploading} onPress={submit}>
        <Text style={styles.submitText}>{saving ? 'Saving...' : initial ? 'Save driver' : 'Add driver'}</Text>
      </Pressable>
    </View>
  );
}

// Who drives the transporter's trips, with their licences.
export function DriversScreen() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{ drivers: Driver[] }>('/transporter-ops/drivers')
      .then(d => setDrivers(d.drivers || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const onSaved = (driver: Driver, wasEdit: boolean) => {
    setDrivers(prev => (wasEdit ? prev.map(d => (d._id === driver._id ? driver : d)) : [driver, ...prev]));
    setEditing(null);
    setAdding(false);
  };

  const remove = (d: Driver) =>
    Alert.alert(`Remove ${d.name}?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/transporter-ops/drivers/${d._id}`, { method: 'DELETE' });
            setDrivers(prev => prev.filter(x => x._id !== d._id));
          } catch (e: any) {
            setError(e.message);
          }
        },
      },
    ]);

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title="Drivers" subtitle="Who drives your trips" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {adding || editing ? (
            <DriverForm
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
              <Text style={styles.addText}>Add driver</Text>
            </Pressable>
          )}

          {loading ? (
            <LoadingView compact />
          ) : drivers.length === 0 && !adding ? (
            <Text style={styles.empty}>No drivers yet. Add your first driver.</Text>
          ) : (
            drivers.map(d => (
              <View key={d._id} style={styles.item}>
                <View style={styles.avatar}>
                  {d.licenseImage ? (
                    <Image source={{ uri: getMediaUrl(d.licenseImage) }} style={styles.fill} />
                  ) : (
                    <UserRound color="#A3A3A3" size={20} />
                  )}
                </View>
                <View style={styles.flex}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {d.name}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {d.phone}
                    {d.licenseNumber ? ` · ${d.licenseNumber}` : ''}
                  </Text>
                  <Text style={[styles.tag, d.isAvailable ? styles.tagGreen : styles.tagGrey]}>
                    {d.isAvailable ? 'Available' : 'On trip'}
                  </Text>
                </View>
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    setAdding(false);
                    setEditing(d);
                  }}>
                  <Pencil color="#525252" size={16} />
                </Pressable>
                <Pressable hitSlop={8} onPress={() => remove(d)}>
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
  noPadding: { padding: 0 },
  flex: { flex: 1, minWidth: 0 },
  fill: { width: '100%', height: '100%' },
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
  row2: { flexDirection: 'row', gap: spacing.sm },
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  itemMeta: { fontSize: 11, color: colors.mutedForeground },
  tag: {
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginTop: 4,
  },
  tagGreen: { backgroundColor: '#D1FAE5', color: '#065F46' },
  tagGrey: { backgroundColor: '#E5E5E5', color: '#525252' },
});
