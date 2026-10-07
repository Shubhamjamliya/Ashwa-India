import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ArrowDownLeft, ArrowUpRight, Plus, Wallet as WalletIcon, X } from 'lucide-react-native';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { LoadingView } from '../../../components/StateViews';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { topUpWallet } from '../../../services/payments';
import { useAuth } from '../../../context/AuthContext';
import { fmtDate, money } from '../../../utils/format';

type Transaction = {
  _id: string;
  type: string;
  amount: number;
  description?: string;
  createdAt: string;
};

type TxMeta = { label: string; color: string; icon: typeof ArrowDownLeft; sign: string };

const CREDIT = { color: colors.success as string, icon: ArrowDownLeft, sign: '+' };
const DEBIT = { color: colors.destructive as string, icon: ArrowUpRight, sign: '-' };

const TYPE_META: Record<string, TxMeta> = {
  wallet_credit: { label: 'Credit', ...CREDIT },
  wallet_debit: { label: 'Debit', ...DEBIT },
  payout: { label: 'Payout', ...CREDIT },
  charge: { label: 'Charge', ...DEBIT },
  refund: { label: 'Refund', ...CREDIT },
};

export function WalletScreen() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTopup, setShowTopup] = useState(false);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [walletRes, txRes] = await Promise.allSettled([
      apiFetch<{ wallet: { balance: number } }>('/payments/wallet'),
      apiFetch<{ transactions: Transaction[] }>('/payments/wallet/transactions'),
    ]);
    if (walletRes.status === 'fulfilled') setBalance(walletRes.value.wallet?.balance ?? 0);
    if (txRes.status === 'fulfilled') setTransactions(txRes.value.transactions || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleTopup = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setError('');
    setProcessing(true);
    try {
      await topUpWallet(amt, user);
      setShowTopup(false);
      setAmount('');
      load();
    } catch (e: any) {
      if (e?.code === 2 || e?.description) setError('Payment was cancelled.');
      else setError(e.message || 'Failed to add money');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title="Wallet" subtitle="Your balance and payments" back="solid" large />

      <FlatList
        data={loading ? [] : transactions}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            <View style={styles.balanceCard}>
              <View style={styles.row}>
                <WalletIcon color={colors.navyMuted} size={16} />
                <Text style={styles.balanceLabel}>Wallet Balance</Text>
              </View>
              <Text style={styles.balance}>{loading ? '—' : money(balance)}</Text>
              <Pressable style={styles.addBtn} onPress={() => setShowTopup(true)}>
                <Plus color={colors.white} size={16} />
                <Text style={styles.addBtnText}>Add Money</Text>
              </Pressable>
            </View>
            <Text style={styles.sectionTitle}>Transactions</Text>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <LoadingView />
          ) : (
            <View style={styles.emptyCard}>
              <WalletIcon color={colors.mutedForeground} size={24} />
              <Text style={styles.emptyText}>No transactions yet.</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const meta = TYPE_META[item.type] || TYPE_META.wallet_credit;
          const Icon = meta.icon;
          return (
            <View style={styles.txCard}>
              <View style={[styles.txIcon, { backgroundColor: `${meta.color}1A` }]}>
                <Icon color={meta.color} size={18} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.txTitle}>{item.description || meta.label}</Text>
                <Text style={styles.txDate}>{fmtDate(item.createdAt)}</Text>
              </View>
              <Text style={[styles.txAmount, { color: meta.color }]}>
                {meta.sign}
                {money(item.amount)}
              </Text>
            </View>
          );
        }}
      />

      <Modal visible={showTopup} transparent animationType="fade" onRequestClose={() => setShowTopup(false)}>
        <KeyboardAvoidingView
          style={styles.backdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.dialog}>
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogTitle}>Add Money</Text>
              <Pressable onPress={() => setShowTopup(false)} hitSlop={8} style={styles.closeBtn}>
                <X color={colors.mutedForeground} size={16} />
              </Pressable>
            </View>
            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput
              value={amount}
              onChangeText={t => setAmount(t.replace(/\D/g, ''))}
              keyboardType="number-pad"
              placeholder="Enter amount"
              placeholderTextColor={colors.mutedForeground}
              autoFocus
              style={styles.input}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              style={[styles.payBtn, processing && styles.disabled]}
              disabled={processing}
              onPress={handleTopup}>
              <Text style={styles.addBtnText}>{processing ? 'Processing...' : 'Proceed to Pay'}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1 },
  content: { padding: spacing.md, gap: 10, paddingBottom: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceCard: { backgroundColor: colors.navy, borderRadius: radius.lg, padding: 20 },
  balanceLabel: { fontSize: 12, fontWeight: '600', color: colors.navyMuted },
  balance: { fontSize: 30, fontWeight: '800', color: colors.white, marginTop: 8 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 10,
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: spacing.lg,
    marginBottom: 2,
  },
  emptyCard: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 40,
  },
  emptyText: { fontSize: 13, color: colors.mutedForeground },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  txIcon: { width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  txTitle: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  txDate: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  dialog: { width: '100%', maxWidth: 380, backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg },
  dialogHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  dialogTitle: { fontSize: 16, fontWeight: '700', color: colors.foreground },
  closeBtn: { width: 32, height: 32, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#404040', marginBottom: 6 },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.foreground,
  },
  error: { fontSize: 13, color: colors.destructive, marginTop: 8 },
  payBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
});
