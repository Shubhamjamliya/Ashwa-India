import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Percent, Wallet } from 'lucide-react-native';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { DashedEmpty, ErrorView, LoadingView } from '../../../components/StateViews';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { fmtDate, money } from '../../../utils/format';

type EarningsData = {
  rule: { active: boolean; percent: number; fixedPerBooking?: number };
  totals: { gross: number; commission: number; net: number };
  settlements: { id: string; settledAt: string; gross: number; commission: number; net: number }[];
};

// What the transporter earned after platform commission.
export function EarningsScreen() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<EarningsData>('/commissions/me')
      .then(setData)
      .catch(e => setError(e.message || 'Failed to load earnings'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title="Earnings" subtitle="What you earned after platform commission" />
      {loading ? (
        <LoadingView />
      ) : error || !data ? (
        <ErrorView message={error || 'Failed to load earnings'} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.inline}>
              <Percent color={colors.primary} size={16} />
              <Text style={styles.cardTitle}>Platform commission</Text>
            </View>
            <Text style={styles.cardText}>
              {data.rule.active
                ? `${data.rule.percent}% of each booking${data.rule.fixedPerBooking ? ` + ${money(data.rule.fixedPerBooking)} fixed` : ''}`
                : 'No commission is currently applied'}
            </Text>
          </View>

          <View style={styles.totals}>
            <View style={[styles.total, styles.navyBox]}>
              <Text style={[styles.totalLabel, styles.navyLabel]}>GROSS</Text>
              <Text style={[styles.totalValue, styles.white]}>{money(data.totals.gross)}</Text>
            </View>
            <View style={[styles.total, styles.goldBox]}>
              <Text style={[styles.totalLabel, styles.goldLabel]}>COMMISSION</Text>
              <Text style={[styles.totalValue, styles.goldLabel]}>{money(data.totals.commission)}</Text>
            </View>
            <View style={[styles.total, styles.greenBox]}>
              <Text style={[styles.totalLabel, styles.greenLabel]}>YOU EARNED</Text>
              <Text style={[styles.totalValue, styles.white]}>{money(data.totals.net)}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>SETTLED TRIPS</Text>
          {data.settlements.length === 0 ? (
            <DashedEmpty icon={<Wallet color="#A3A3A3" size={24} />} text="Completed trips will show their earnings here." />
          ) : (
            data.settlements.map(s => (
              <View key={s.id} style={styles.settlement}>
                <View style={styles.rowBetween}>
                  <Text style={styles.date}>{fmtDate(s.settledAt)}</Text>
                  <Text style={styles.net}>+{money(s.net)}</Text>
                </View>
                <Text style={styles.breakdown}>
                  Booking {money(s.gross)} − commission {money(s.commission)}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.lg },
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: spacing.md },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  cardText: { fontSize: 13, color: '#525252', marginTop: 4 },
  totals: { flexDirection: 'row', gap: spacing.sm },
  total: { flex: 1, borderRadius: radius.md, padding: 12 },
  navyBox: { backgroundColor: colors.navy },
  goldBox: { backgroundColor: colors.accent },
  greenBox: { backgroundColor: '#059669' },
  totalLabel: { fontSize: 10, letterSpacing: 0.4 },
  navyLabel: { color: colors.navyMuted },
  goldLabel: { color: colors.accentForeground },
  greenLabel: { color: 'rgba(255,255,255,0.8)' },
  totalValue: { fontSize: 14, fontWeight: '800', marginTop: 4 },
  white: { color: colors.white },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, color: colors.mutedForeground },
  settlement: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 14 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontSize: 12, color: colors.mutedForeground },
  net: { fontSize: 14, fontWeight: '800', color: '#047857' },
  breakdown: { fontSize: 11, color: colors.mutedForeground, marginTop: 4 },
});
