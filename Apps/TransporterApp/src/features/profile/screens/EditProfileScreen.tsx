import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Building2, Mail, MapPinned, Phone, Save, User as UserIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { LightHeader } from '../../../components/LightHeader';
import { SelectField } from '../../../components/SelectField';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import type { ServiceType } from '../../../services/storage';

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: 'private', label: 'Private only' },
  { value: 'shared', label: 'Shared only' },
  { value: 'both', label: 'Private & Shared' },
];

function Label({ icon: Icon, children }: { icon?: typeof Mail; children: string }) {
  return (
    <View style={styles.labelRow}>
      {Icon ? <Icon color="#404040" size={14} /> : null}
      <Text style={styles.label}>{children}</Text>
    </View>
  );
}

function Box(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput placeholderTextColor={colors.mutedForeground} {...props} style={[styles.input, props.style]} />;
}

export function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [serviceArea, setServiceArea] = useState(user?.serviceArea || '');
  const [serviceType, setServiceType] = useState<ServiceType>(user?.serviceType || 'private');
  const [vehicleTypes, setVehicleTypes] = useState((user?.vehicleTypes || []).join(', '));
  const [pricePerKm, setPricePerKm] = useState(user?.pricePerKm ? String(user.pricePerKm) : '');
  const [baseFare, setBaseFare] = useState(user?.baseFare ? String(user.baseFare) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Enter your name');
      return;
    }
    const rate = Number(pricePerKm);
    if (!(rate > 0)) {
      setError('Set your price per km (more than ₹0) so users can book you');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const data = await apiFetch<{ transporter: any }>('/transporters/me', {
        method: 'PATCH',
        body: {
          name: name.trim(),
          businessName: businessName.trim(),
          email: email.trim(),
          serviceArea: serviceArea.trim(),
          serviceType,
          vehicleTypes: vehicleTypes.split(',').map(v => v.trim()).filter(Boolean),
          pricePerKm: rate,
          baseFare: Number(baseFare) || 0,
        },
      });
      const t = data.transporter || {};
      if (user) {
        await updateUser({
          ...user,
          name: t.name,
          businessName: t.businessName,
          email: t.email,
          serviceArea: t.serviceArea,
          serviceType: t.serviceType,
          vehicleTypes: t.vehicleTypes,
          pricePerKm: t.pricePerKm,
          baseFare: t.baseFare,
        });
      }
      navigation.goBack();
    } catch (e: any) {
      setError(e.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen style={styles.noPadding}>
      <LightHeader title="Edit Profile" titleSize={17} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarWrap}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <UserIcon color={colors.primary} size={32} />
              </View>
            </View>
          </View>

          <View>
            <Label>Full Name</Label>
            <Box value={name} onChangeText={setName} placeholder="Your name" />
          </View>
          <View>
            <Label icon={Building2}>Business Name</Label>
            <Box value={businessName} onChangeText={setBusinessName} placeholder="Your transport business name" />
          </View>
          <View>
            <Label icon={Mail}>Email</Label>
            <Box value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View>
            <Label icon={Phone}>Phone Number</Label>
            <Box value={user?.phone || ''} editable={false} style={styles.inputDisabled} />
            <Text style={styles.hint}>Verified via OTP, can't be changed here.</Text>
          </View>
          <View>
            <Label icon={MapPinned}>Service Area</Label>
            <Box value={serviceArea} onChangeText={setServiceArea} placeholder="e.g. Delhi NCR, Punjab" />
          </View>
          <View>
            <Label>Service Type</Label>
            <SelectField title="Service type" value={serviceType} options={SERVICE_TYPES} onChange={setServiceType} />
          </View>
          <View>
            <Label>Vehicle Types</Label>
            <Box value={vehicleTypes} onChangeText={setVehicleTypes} placeholder="e.g. Open truck, Covered van" />
            <Text style={styles.hint}>Comma-separated</Text>
          </View>

          <View style={styles.pricing}>
            <Text style={styles.pricingTitle}>Your pricing</Text>
            <Text style={styles.pricingHint}>
              Users see your estimate before they book. Price is trip distance × rate, plus base fare.
            </Text>
            <View style={styles.row2}>
              <View style={styles.flex}>
                <Label>Price per km (₹)</Label>
                <Box value={pricePerKm} onChangeText={t => setPricePerKm(t.replace(/[^\d.]/g, ''))} keyboardType="decimal-pad" placeholder="e.g. 25" />
              </View>
              <View style={styles.flex}>
                <Label>Base fare (₹)</Label>
                <Box value={baseFare} onChangeText={t => setBaseFare(t.replace(/[^\d.]/g, ''))} keyboardType="decimal-pad" placeholder="e.g. 500" />
              </View>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={[styles.save, saving && styles.disabled]} disabled={saving} onPress={handleSave}>
            <Save color={colors.white} size={16} />
            <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1, minWidth: 0 },
  disabled: { opacity: 0.5 },
  content: { gap: 12, paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  avatarWrap: { alignItems: 'center', marginBottom: spacing.sm },
  avatarRing: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 74, height: 74, borderRadius: 37, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  label: { fontSize: 12, fontWeight: '600', color: '#404040' },
  input: {
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: 14,
    color: colors.foreground,
  },
  inputDisabled: { backgroundColor: '#FAFAFA', color: colors.mutedForeground },
  hint: { fontSize: 11, color: '#A3A3A3', marginTop: 4 },
  pricing: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: spacing.md },
  pricingTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  pricingHint: { fontSize: 11, color: colors.mutedForeground, marginTop: 2, marginBottom: 12 },
  row2: { flexDirection: 'row', gap: spacing.sm },
  error: { fontSize: 13, color: colors.destructive },
  save: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    paddingVertical: 12,
  },
  saveText: { fontSize: 14, fontWeight: '600', color: colors.white },
});
