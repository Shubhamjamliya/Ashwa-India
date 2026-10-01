import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar, CheckCircle2, Clock, MapPin, XCircle } from 'lucide-react-native';
import { Screen } from '../../../components/Screen';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getSocket } from '../../../services/socket';
import type { TransportRequest, TransportRequestStatus } from '../../transport/types';

const STATUS_META: Record<TransportRequestStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Waiting for response', color: colors.warning, icon: Clock },
  accepted: { label: 'Accepted', color: colors.success, icon: CheckCircle2 },
  rejected: { label: 'Declined', color: colors.destructive, icon: XCircle },
  cancelled: { label: 'Cancelled', color: colors.mutedForeground, icon: XCircle },
};

export function BookingsScreen() {
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ requests: TransportRequest[] }>('/transport/requests/mine');
      setRequests(data.requests);
    } catch {
      // keep whatever was loaded before
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    let active = true;
    getSocket().then(socket => {
      if (!active) return;
      const onUpdate = (updated: TransportRequest) => {
        setRequests(prev => prev.map(r => (r._id === updated._id ? updated : r)));
      };
      socket.on('transport:update', onUpdate);
      return () => socket.off('transport:update', onUpdate);
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <Screen style={styles.screen}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (requests.length === 0) {
    return (
      <Screen style={styles.screen}>
        <View style={styles.center}>
          <Calendar color={colors.mutedForeground} size={32} />
          <Text style={styles.title}>No bookings yet</Text>
          <Text style={styles.text}>
            Your service, transport and marketplace bookings will show up here.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.noPadding}>
      <Text style={styles.header}>Transport Requests</Text>
      <FlatList
        data={requests}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const meta = STATUS_META[item.status];
          const StatusIcon = meta.icon;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.transporterName} numberOfLines={1}>
                  {item.transporter.businessName || item.transporter.name || 'Transporter'}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: `${meta.color}1A` }]}>
                  <StatusIcon size={12} color={meta.color} />
                  <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                </View>
              </View>
              <View style={styles.routeRow}>
                <MapPin size={12} color={colors.mutedForeground} />
                <Text style={styles.routeText} numberOfLines={2}>
                  {item.source.address} → {item.destination.address}
                </Text>
              </View>
              <Text style={styles.typeText}>{item.type === 'shared' ? 'Shared ride' : 'Private transport'}</Text>
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: spacing.md,
  },
  noPadding: {
    padding: 0,
  },
  header: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.foreground,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: 8,
  },
  text: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  list: {
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  transporterName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: spacing.sm,
  },
  routeText: {
    flex: 1,
    fontSize: 12,
    color: colors.mutedForeground,
  },
  typeText: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 6,
    fontWeight: '600',
  },
});
