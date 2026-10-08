import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { LoadingView } from '../../../components/StateViews';
import { Stars } from '../../../components/Stars';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';

type ReviewsData = {
  rating?: { average: number; count: number };
  reviews: { id: string; userName: string; rating: number; comment?: string; createdAt: string }[];
};

// What customers say about the transporter's trips.
export function ReviewsScreen() {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<ReviewsData>('/transporter-ops/reviews/mine')
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const avg = Number(data?.rating?.average || 0);
  const count = data?.rating?.count || 0;

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title="Ratings & reviews" subtitle="What customers say about your trips" />
      <ScrollView contentContainerStyle={styles.content}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading ? (
          <LoadingView compact />
        ) : (
          <>
            <View style={styles.summary}>
              <Text style={styles.avg}>{avg ? avg.toFixed(1) : '—'}</Text>
              <View>
                <Stars value={Math.round(avg)} />
                <Text style={styles.count}>
                  {count} review{count === 1 ? '' : 's'}
                </Text>
              </View>
            </View>

            {(data?.reviews || []).length === 0 ? (
              <Text style={styles.empty}>No reviews yet. Reviews appear after a completed trip is rated.</Text>
            ) : (
              data!.reviews.map(r => (
                <View key={r.id} style={styles.review}>
                  <View style={styles.reviewTop}>
                    <Text style={styles.name}>{r.userName}</Text>
                    <Stars value={r.rating} />
                  </View>
                  {r.comment ? <Text style={styles.comment}>{r.comment}</Text> : null}
                  <Text style={styles.date}>{new Date(r.createdAt).toLocaleDateString('en-IN')}</Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  content: { gap: 12, padding: spacing.md, paddingBottom: spacing.xl },
  error: { fontSize: 12, color: colors.destructive },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avg: { fontSize: 36, fontWeight: '800', color: colors.foreground },
  count: { fontSize: 12, color: colors.mutedForeground, marginTop: 4 },
  empty: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', paddingVertical: 32 },
  review: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 12 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  comment: { fontSize: 13, color: '#404040', marginTop: 4 },
  date: { fontSize: 10, color: '#A3A3A3', marginTop: 4 },
});
