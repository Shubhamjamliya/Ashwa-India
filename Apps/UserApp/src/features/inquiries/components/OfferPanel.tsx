import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CheckCircle2, Phone, XCircle } from 'lucide-react-native';
import { colors, radius } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { money } from '../../../utils/format';
import type { Inquiry } from '../types';

// Price talk for one horse enquiry, from the buyer's side.
// No payment happens here. The parties agree a price, then call each other.
export function OfferPanel({ inquiry, onChanged }: { inquiry: Inquiry; onChanged: () => void }) {
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const quote = inquiry.quote;
  const pending = quote?.status === 'pending';
  const canAnswer = pending && quote?.by !== 'user';
  const sellerPhone = inquiry.seller?.phone;
  const sellerName = inquiry.seller?.businessName || inquiry.seller?.name;

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      onChanged();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const sendOffer = () =>
    run(async () => {
      await apiFetch(`/marketplace/inquiries/${inquiry._id}/messages`, {
        method: 'POST',
        body: { text: '', offerAmount: Number(amount) },
      });
      setAmount('');
    });

  const answer = (action: 'accept' | 'decline') =>
    run(() => apiFetch(`/marketplace/inquiries/${inquiry._id}/quote`, { method: 'PATCH', body: { action } }));

  return (
    <View style={styles.panel}>
      <View style={styles.topRow}>
        <View style={styles.flex}>
          <Text style={styles.kicker}>Price talk</Text>
          {inquiry.agreedAmount ? (
            <View style={styles.row}>
              <CheckCircle2 color="#047857" size={16} />
              <Text style={styles.agreed}>Agreed at {money(inquiry.agreedAmount)}</Text>
            </View>
          ) : pending && quote ? (
            <Text style={styles.status}>
              Offer {money(quote.amount)} · {quote.by === 'user' ? 'from you, waiting for reply' : 'from them'}
            </Text>
          ) : quote?.status === 'declined' ? (
            <Text style={styles.muted}>Last offer of {money(quote.amount)} was declined</Text>
          ) : (
            <Text style={styles.muted}>No offer yet. Make one below.</Text>
          )}
        </View>
        {sellerPhone ? (
          <Pressable style={styles.callBtn} onPress={() => Linking.openURL(`tel:${sellerPhone}`)}>
            <Phone color={colors.white} size={14} />
            <Text style={styles.callText}>Call {sellerName ? sellerName.split(' ')[0] : ''}</Text>
          </Pressable>
        ) : null}
      </View>

      {canAnswer && quote ? (
        <View style={styles.row}>
          <Pressable style={[styles.answerBtn, styles.navyBtn]} disabled={busy} onPress={() => answer('accept')}>
            <CheckCircle2 color={colors.white} size={14} />
            <Text style={styles.navyText}>Accept {money(quote.amount)}</Text>
          </Pressable>
          <Pressable style={[styles.answerBtn, styles.outlineBtn]} disabled={busy} onPress={() => answer('decline')}>
            <XCircle color={colors.foreground} size={14} />
            <Text style={styles.outlineText}>Decline</Text>
          </Pressable>
        </View>
      ) : null}

      {!inquiry.agreedAmount ? (
        <View style={styles.row}>
          <TextInput
            value={amount}
            onChangeText={t => setAmount(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
            placeholder={pending ? 'Counter-offer (₹)' : 'Your offer (₹)'}
            placeholderTextColor={colors.mutedForeground}
            style={styles.input}
          />
          <Pressable
            style={[styles.offerBtn, (busy || !amount) && styles.disabled]}
            disabled={busy || !amount}
            onPress={sendOffer}>
            <Text style={styles.navyText}>Send offer</Text>
          </Pressable>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  panel: {
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: '#FBF8F1',
    padding: 12,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  agreed: { fontSize: 14, fontWeight: '700', color: '#047857' },
  status: { fontSize: 13, fontWeight: '700', color: colors.foreground },
  muted: { fontSize: 13, color: '#525252' },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  callText: { fontSize: 12, fontWeight: '700', color: colors.white },
  answerBtn: {
    flex: 1,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: radius.sm,
  },
  navyBtn: { backgroundColor: colors.navy },
  navyText: { fontSize: 12, fontWeight: '700', color: colors.white },
  outlineBtn: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  outlineText: { fontSize: 12, fontWeight: '700', color: colors.foreground },
  input: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: 13,
    color: colors.foreground,
  },
  offerBtn: {
    height: 36,
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
  },
  disabled: { opacity: 0.5 },
  error: { fontSize: 12, color: colors.destructive },
});
