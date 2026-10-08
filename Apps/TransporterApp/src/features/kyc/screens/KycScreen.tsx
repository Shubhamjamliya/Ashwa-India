import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, Clock, XCircle } from 'lucide-react-native';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { LoadingView } from '../../../components/StateViews';
import { FieldLabel, TextField } from '../../../components/FormControls';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { choosePhotos, uploadPhoto } from '../../../services/images';

type KycStatus = 'not_submitted' | 'submitted' | 'verified' | 'rejected';

const STATUS: Record<KycStatus, { label: string; bg: string; fg: string; Icon: typeof Clock }> = {
  not_submitted: { label: 'Not submitted', bg: '#E5E5E5', fg: '#404040', Icon: Clock },
  submitted: { label: 'Under review', bg: '#FEF3C7', fg: '#92400E', Icon: Clock },
  verified: { label: 'Verified', bg: '#D1FAE5', fg: '#065F46', Icon: CheckCircle2 },
  rejected: { label: 'Rejected', bg: '#FFE4E6', fg: '#9F1239', Icon: XCircle },
};

type Kyc = {
  status?: KycStatus;
  rejectionReason?: string;
  identityProof?: { url?: string };
  businessLicense?: { url?: string };
  gst?: { number?: string; certificate?: { url?: string } };
  bank?: { accountName?: string; accountNumber?: string; ifsc?: string; bankName?: string };
};

type DocKey = 'identityProof' | 'businessLicense' | 'gstCert';

function DocField({
  label,
  value,
  onPick,
  required,
  busy,
}: {
  label: string;
  value: string;
  onPick: () => void;
  required?: boolean;
  busy?: boolean;
}) {
  return (
    <View style={styles.doc}>
      <View style={styles.flex}>
        <Text style={styles.docTitle}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
        <Text style={styles.docState}>{value ? 'Uploaded' : 'Photo or scan (PNG, JPG, WEBP)'}</Text>
      </View>
      <Pressable style={[styles.docBtn, busy && styles.disabled]} disabled={busy} onPress={onPick}>
        {busy ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={styles.docBtnText}>{value ? 'Replace' : 'Upload'}</Text>}
      </Pressable>
    </View>
  );
}

// Identity, licence, GST and bank details. Needed before withdrawals.
export function KycScreen() {
  const [kyc, setKyc] = useState<Kyc | null>(null);
  const [companyType, setCompanyType] = useState<'individual' | 'company'>('individual');
  const [docs, setDocs] = useState<Record<DocKey, string>>({ identityProof: '', businessLicense: '', gstCert: '' });
  const [gstNumber, setGstNumber] = useState('');
  const [bank, setBank] = useState({ accountName: '', accountNumber: '', ifsc: '', bankName: '' });
  const [uploading, setUploading] = useState<DocKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  useEffect(() => {
    apiFetch<{ kyc?: Kyc; companyType?: 'individual' | 'company' }>('/transporter-ops/kyc')
      .then(d => {
        const k = d.kyc || {};
        setKyc(k);
        if (d.companyType) setCompanyType(d.companyType);
        setDocs({
          identityProof: k.identityProof?.url || '',
          businessLicense: k.businessLicense?.url || '',
          gstCert: k.gst?.certificate?.url || '',
        });
        setGstNumber(k.gst?.number || '');
        if (k.bank) {
          setBank({
            accountName: k.bank.accountName || '',
            accountNumber: k.bank.accountNumber || '',
            ifsc: k.bank.ifsc || '',
            bankName: k.bank.bankName || '',
          });
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const pick = async (key: DocKey) => {
    setError('');
    try {
      const [photo] = await choosePhotos();
      if (!photo) return;
      setUploading(key);
      const url = await uploadPhoto(photo);
      setDocs(p => ({ ...p, [key]: url }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(null);
    }
  };

  const submit = async () => {
    setSaving(true);
    setError('');
    setDone('');
    try {
      const body = {
        companyType,
        identityProof: { url: docs.identityProof },
        businessLicense: { url: docs.businessLicense },
        gst: gstNumber.trim()
          ? { number: gstNumber.trim(), certificate: docs.gstCert ? { url: docs.gstCert } : undefined }
          : { number: '' },
        bank,
      };
      const d = await apiFetch<{ kyc: Kyc }>('/transporter-ops/kyc', { method: 'PUT', body });
      setKyc(d.kyc);
      setDone('KYC submitted. We will review it and let you know.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const status = STATUS[kyc?.status || 'not_submitted'];
  const locked = kyc?.status === 'verified';

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title="Verification (KYC)" subtitle="Needed before you can withdraw earnings" />
      {loading ? (
        <LoadingView compact />
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={[styles.status, { backgroundColor: status.bg }]}>
              <status.Icon color={status.fg} size={16} />
              <View style={styles.flex}>
                <Text style={[styles.statusLabel, { color: status.fg }]}>{status.label}</Text>
                {kyc?.status === 'rejected' && kyc.rejectionReason ? (
                  <Text style={[styles.statusReason, { color: status.fg }]}>Reason: {kyc.rejectionReason}</Text>
                ) : null}
              </View>
            </View>

            <View>
              <FieldLabel>Business type</FieldLabel>
              <View style={styles.typeRow}>
                {(
                  [
                    ['individual', 'Individual'],
                    ['company', 'Company'],
                  ] as const
                ).map(([v, l]) => (
                  <Pressable
                    key={v}
                    disabled={locked}
                    onPress={() => setCompanyType(v)}
                    style={[styles.typeBtn, companyType === v && styles.typeBtnActive]}>
                    <Text style={[styles.typeText, companyType === v && styles.typeTextActive]}>{l}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <DocField
              label="Identity proof (Aadhaar / PAN)"
              value={docs.identityProof}
              required
              busy={uploading === 'identityProof'}
              onPick={() => pick('identityProof')}
            />
            <DocField
              label="Business licence / registration"
              value={docs.businessLicense}
              required
              busy={uploading === 'businessLicense'}
              onPick={() => pick('businessLicense')}
            />

            <View style={styles.box}>
              <Text style={styles.boxTitle}>GST (optional)</Text>
              <TextField
                placeholder="GSTIN"
                autoCapitalize="characters"
                value={gstNumber}
                editable={!locked}
                onChangeText={setGstNumber}
              />
              <DocField label="GST certificate" value={docs.gstCert} busy={uploading === 'gstCert'} onPick={() => pick('gstCert')} />
            </View>

            <View style={styles.box}>
              <Text style={styles.boxTitle}>Bank account for payouts</Text>
              <TextField
                placeholder="Account holder name"
                value={bank.accountName}
                editable={!locked}
                onChangeText={v => setBank({ ...bank, accountName: v })}
              />
              <TextField
                placeholder="Account number"
                keyboardType="number-pad"
                value={bank.accountNumber}
                editable={!locked}
                onChangeText={v => setBank({ ...bank, accountNumber: v.replace(/\D/g, '') })}
              />
              <View style={styles.row2}>
                <TextField
                  style={styles.flex}
                  placeholder="IFSC"
                  autoCapitalize="characters"
                  value={bank.ifsc}
                  editable={!locked}
                  onChangeText={v => setBank({ ...bank, ifsc: v })}
                />
                <TextField
                  style={styles.flex}
                  placeholder="Bank name"
                  value={bank.bankName}
                  editable={!locked}
                  onChangeText={v => setBank({ ...bank, bankName: v })}
                />
              </View>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {done ? <Text style={styles.done}>{done}</Text> : null}

            {!locked ? (
              <Pressable style={[styles.submit, saving && styles.disabled]} disabled={saving} onPress={submit}>
                <Text style={styles.submitText}>{saving ? 'Submitting...' : 'Submit for verification'}</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1, minWidth: 0 },
  disabled: { opacity: 0.5 },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xl },
  status: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, borderRadius: radius.md, padding: 12 },
  statusLabel: { fontSize: 14, fontWeight: '700' },
  statusReason: { fontSize: 12 },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingVertical: 10,
  },
  typeBtnActive: { borderColor: colors.primary, backgroundColor: '#FBEFD6' },
  typeText: { fontSize: 14, fontWeight: '700', color: '#525252' },
  typeTextActive: { color: colors.foreground },
  doc: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 12,
  },
  docTitle: { fontSize: 13, fontWeight: '700', color: colors.foreground },
  required: { color: '#E11D48' },
  docState: { fontSize: 10, color: colors.mutedForeground },
  docBtn: {
    minWidth: 64,
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  docBtnText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  box: { gap: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 12 },
  boxTitle: { fontSize: 13, fontWeight: '700', color: colors.foreground },
  row2: { flexDirection: 'row', gap: spacing.sm },
  error: { fontSize: 12, color: colors.destructive },
  done: { fontSize: 12, color: '#047857' },
  submit: { borderRadius: radius.md, backgroundColor: colors.primary, paddingVertical: 12, alignItems: 'center' },
  submitText: { fontSize: 14, fontWeight: '700', color: colors.white },
});
