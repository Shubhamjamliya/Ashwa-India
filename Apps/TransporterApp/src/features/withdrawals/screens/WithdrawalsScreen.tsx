import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import type { AppNavigation } from '../../../navigation/types';

const fmt = (n?: number | null) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  requested: { label: 'Requested', bg: '#FEF3C7', fg: '#92400E' },
  approved: { label: 'Approved', bg: '#DBEAFE', fg: '#1E40AF' },
  paid: { label: 'Paid', bg: '#D1FAE5', fg: '#065F46' },
  rejected: { label: 'Rejected', bg: '#FFE4E6', fg: '#9F1239' },
};

type Withdrawal = { _id: string; amount: number; status: string; note?: string; createdAt: string };

// Move wallet earnings to the bank. Needs verified KYC first.
export function WithdrawalsScreen() {
  const navigation = useNavigation<AppNavigation>();
  const [balance, setBalance] = useState<number | null>(null);
  const [kycStatus, setKycStatus] = useState('not_submitted');
  const [list, setList] = useState<Withdrawal[]>([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const load = useCallback(
    () =>
      Promise.allSettled([
        apiFetch<{ wallet?: { balance: number }; balance?: number }>('/payments/wallet'),
        apiFetch<{ kyc?: { status: string } }>('/transporter-ops/kyc'),
        apiFetch<{ withdrawals: Withdrawal[] }>('/transporter-ops/withdrawals/mine'),
      ]).then(([w, k, l]) => {
        if (w.status === 'fulfilled') setBalance(w.value.wallet?.balance ?? w.value.balance ?? 0);
        if (k.status === 'fulfilled') setKycStatus(k.value.kyc?.status || 'not_submitted');
        if (l.status === 'fulfilled') setList(l.value.withdrawals || []);
      }),
    [],
  );

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const verified = kycStatus === 'verified';

  const submit = async () => {
    setSaving(true);
    setError('');
    setDone('');
    try {
      const d = await apiFetch<{ withdrawal: Withdrawal }>('/transporter-ops/withdrawals', {
        method: 'POST',
        body: { amount: Number(amount) },
      });
      setList(prev => [d.withdrawal, ...prev]);
      setAmount('');
      setDone('Withdrawal requested. Admin will process it to your bank account.');
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title="Withdrawals" subtitle="Move wallet earnings to your bank" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.balanceCard}>
          <Text style={styles.muted}>Available balance</Text>
          <Text style={styles.balance}>{loading ? '—' : fmt(balance)}</Text>
        </View>

        {!verified ? (
          <View style={styles.kycNote}>
            <Text style={styles.kycText}>
              Complete KYC verification before requesting a withdrawal.{' '}
              <Text style={styles.kycLink} onPress={() => navigation.navigate('Kyc')}>
                Go to KYC
              </Text>
            </Text>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Amount (₹)</Text>
            <TextInput
              value={amount}
              onChangeText={t => setAmount(t.replace(/[^\d.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="Enter amount"
              placeholderTextColor={colors.mutedForeground}
              style={styles.input}
            />
            <Pressable
              style={[styles.submit, (saving || !amount || Number(amount) <= 0) && styles.disabled]}
              disabled={saving || !amount || Number(amount) <= 0}
              onPress={submit}>
              <Text style={styles.submitText}>{saving ? 'Requesting...' : 'Request withdrawal'}</Text>
            </Pressable>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {done ? <Text style={styles.done}>{done}</Text> : null}

        <View>
          <Text style={styles.history}>History</Text>
          {list.length === 0 ? (
            <Text style={styles.empty}>No withdrawals yet.</Text>
          ) : (
            <View style={styles.gap8}>
              {list.map(w => {
                const s = STATUS[w.status] || STATUS.requested;
                return (
                  <View key={w._id} style={styles.item}>
                    <View style={styles.flex}>
                      <Text style={styles.itemAmount}>{fmt(w.amount)}</Text>
                      <Text style={styles.itemDate}>
                        {new Date(w.createdAt).toLocaleDateString('en-IN')}
                        {w.note ? ` · ${w.note}` : ''}
                      </Text>
                    </View>
                    <Text style={[styles.badge, { backgroundColor: s.bg, color: s.fg }]}>{s.label}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1 },
  gap8: { gap: spacing.sm },
  disabled: { opacity: 0.5 },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xl },
  balanceCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  muted: { fontSize: 12, color: colors.mutedForeground },
  balance: { fontSize: 24, fontWeight: '800', color: colors.foreground },
  kycNote: { borderRadius: radius.md, borderWidth: 1, borderColor: '#FCD34D', backgroundColor: '#FFFBEB', padding: 12 },
  kycText: { fontSize: 14, color: '#78350F' },
  kycLink: { fontWeight: '700', textDecorationLine: 'underline' },
  form: { gap: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: spacing.md },
  label: { fontSize: 12, fontWeight: '600', color: '#404040' },
  input: {
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: 14,
    color: colors.foreground,
  },
  submit: { borderRadius: radius.md, backgroundColor: colors.primary, paddingVertical: 12, alignItems: 'center' },
  submitText: { fontSize: 14, fontWeight: '700', color: colors.white },
  error: { fontSize: 12, color: colors.destructive },
  done: { fontSize: 12, color: '#047857' },
  history: { fontSize: 14, fontWeight: '700', color: colors.foreground, marginBottom: spacing.sm },
  empty: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', paddingVertical: 24 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 12,
  },
  itemAmount: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  itemDate: { fontSize: 11, color: colors.mutedForeground },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
});
