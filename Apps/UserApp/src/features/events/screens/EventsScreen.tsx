import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, MapPin } from 'lucide-react-native';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { EmptyView, ErrorView, LoadingView } from '../../../components/StateViews';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getMediaUrl } from '../../../services/media';

type HorseEvent = {
  _id: string;
  title: string;
  eventType: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  description?: string;
  image?: string;
};

const TYPE_LABELS: Record<string, string> = {
  'horse-show': 'Horse show',
  auction: 'Auction',
  competition: 'Competition',
  'training-camp': 'Training camp',
  exhibition: 'Exhibition',
  other: 'Event',
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export function EventsScreen() {
  const [events, setEvents] = useState<HorseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{ events: HorseEvent[] }>('/events', { auth: false })
      .then(data => setEvents(data.events || []))
      .catch(e => setError(e.message || 'Failed to load events'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title="Horse Events" back="solid" />
      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={error} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyView
              icon={<CalendarDays color={colors.mutedForeground} size={32} />}
              title="No events right now"
              text="Horse shows, auctions and camps will appear here."
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.image ? <Image source={{ uri: getMediaUrl(item.image) }} style={styles.image} /> : null}
              <View style={styles.body}>
                <Text style={styles.type}>{TYPE_LABELS[item.eventType] || 'Event'}</Text>
                <Text style={styles.title}>{item.title}</Text>
                <View style={styles.row}>
                  <CalendarDays color={colors.primary} size={14} />
                  <Text style={styles.when}>
                    {fmtDate(item.startsAt)}
                    {item.endsAt ? ` – ${fmtDate(item.endsAt)}` : ''}
                  </Text>
                </View>
                {item.location ? (
                  <View style={styles.row}>
                    <MapPin color={colors.mutedForeground} size={14} />
                    <Text style={styles.where}>{item.location}</Text>
                  </View>
                ) : null}
                {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  list: { padding: spacing.md, gap: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  image: { width: '100%', height: 160, backgroundColor: colors.muted },
  body: { padding: spacing.md, gap: 6 },
  type: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    color: colors.accentForeground,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  title: { fontSize: 15, fontWeight: '700', color: colors.foreground, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  when: { flex: 1, fontSize: 12, fontWeight: '600', color: '#525252' },
  where: { flex: 1, fontSize: 12, color: colors.mutedForeground },
  desc: { fontSize: 13, lineHeight: 20, color: '#525252', paddingTop: 4 },
});
