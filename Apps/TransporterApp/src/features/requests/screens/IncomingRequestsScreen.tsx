import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BellRing, CheckCircle2, Clock, LogOut, MapPin, Phone, XCircle } from 'lucide-react-native';
import { Screen } from '../../../components/Screen';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getSocket } from '../../../services/socket';
import { useAuth } from '../../../context/AuthContext';
import type { TransportRequest, TransportRequestStatus } from '../types';

const STATUS_META: Record<TransportRequestStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: colors.warning, icon: Clock },
  accepted: { label: 'Accepted', color: colors.success, icon: CheckCircle2 },
  rejected: { label: 'Declined', color: colors.destructive, icon: XCircle },
  cancelled: { label: 'Cancelled', color: colors.mutedForeground, icon: XCircle },
};

export function IncomingRequestsScreen() {
  const { logout } = useAuth();
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [ringingRequest, setRingingRequest] = useState<TransportRequest | null>(null);
  const [responding, setResponding] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ requests: TransportRequest[] }>('/transport/requests/incoming');
      setRequests(data.requests);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let active = true;
    getSocket().then(socket => {
      if (!active) return;
      const onNew = (incoming: TransportRequest) => {
        setRequests(prev => [incoming, ...prev]);
        setRingingRequest(incoming);
      };
      socket.on('transport:new', onNew);
      return () => socket.off('transport:new', onNew);
    });
    return () => {
      active = false;
    };
  }, []);

  const respond = async (id: string, action: 'accept' | 'reject') => {
    setResponding(true);
    try {
      const data = await apiFetch<{ request: TransportRequest }>(`/transport/requests/${id}/respond`, {
        method: 'PATCH',
        body: { action },
      });
      setRequests(prev => prev.map(r => (r._id === id ? data.request : r)));
      if (ringingRequest?._id === id) setRingingRequest(null);
    } finally {
      setResponding(false);
    }
  };

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Incoming Requests</Text>
          <Text style={styles.headerSubtitle}>Transport enquiries from users</Text>
        </View>
        <Pressable onPress={logout} hitSlop={12} style={styles.logoutBtn}>
          <LogOut color={colors.navyForeground} size={18} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.center}>
          <BellRing color={colors.mutedForeground} size={32} />
          <Text style={styles.emptyText}>No requests yet. You'll be notified the moment one arrives.</Text>
        </View>
      ) : (
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
                  <Text style={styles.userName} numberOfLines={1}>
                    {item.user.name || item.user.phone}
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

                {item.status === 'pending' && (
                  <View style={styles.actionRow}>
                    <Pressable
                      style={[styles.actionBtn, styles.rejectBtn]}
                      disabled={responding}
                      onPress={() => respond(item._id, 'reject')}>
                      <Text style={styles.rejectBtnText}>Decline</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.actionBtn, styles.acceptBtn]}
                      disabled={responding}
                      onPress={() => respond(item._id, 'accept')}>
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      <Modal visible={Boolean(ringingRequest)} transparent animationType="fade">
        <View style={styles.ringOverlay}>
          <View style={styles.ringCard}>
            <View style={styles.ringIconWrap}>
              <Phone color={colors.white} size={32} />
            </View>
            <Text style={styles.ringTitle}>New Transport Enquiry</Text>
            {ringingRequest && (
              <>
                <Text style={styles.ringUser}>{ringingRequest.user.name || ringingRequest.user.phone}</Text>
                <Text style={styles.ringRoute} numberOfLines={2}>
                  {ringingRequest.source.address} → {ringingRequest.destination.address}
                </Text>
                <View style={styles.ringActions}>
                  <Pressable
                    style={[styles.ringActionBtn, styles.ringReject]}
                    disabled={responding}
                    onPress={() => respond(ringingRequest._id, 'reject')}>
                    <XCircle color={colors.white} size={22} />
                    <Text style={styles.ringActionText}>Decline</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.ringActionBtn, styles.ringAccept]}
                    disabled={responding}
                    onPress={() => respond(ringingRequest._id, 'accept')}>
                    <CheckCircle2 color={colors.white} size={22} />
                    <Text style={styles.ringActionText}>Accept</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.navy,
    padding: spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navyForeground,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.navyMuted,
    marginTop: 2,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navyLight,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  list: {
    padding: spacing.md,
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
  userName: {
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
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  rejectBtn: {
    backgroundColor: colors.muted,
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
  },
  acceptBtn: {
    backgroundColor: colors.primary,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  ringOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11,28,51,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  ringCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  ringIconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  ringTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
  },
  ringUser: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.foreground,
    marginTop: spacing.sm,
  },
  ringRoute: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  ringActions: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  ringActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: 88,
    height: 88,
    borderRadius: radius.full,
  },
  ringReject: {
    backgroundColor: colors.destructive,
  },
  ringAccept: {
    backgroundColor: colors.success,
  },
  ringActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
});
