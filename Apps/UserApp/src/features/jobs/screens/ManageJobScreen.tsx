import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Phone } from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { ErrorView, LoadingView } from '../../../components/StateViews';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getMediaUrl } from '../../../services/media';
import type { HomeStackParamList } from '../../../navigation/types';
import {
  APPLICATION_LABEL,
  JOB_CATEGORY_LABEL,
  type ApplicationStatus,
  type Job,
  type JobApplication,
  type JobStatus,
} from '../types';

type Rt = RouteProp<HomeStackParamList, 'ManageJob'>;

const JOB_STATUS: Record<JobStatus, { label: string; bg: string; fg: string }> = {
  active: { label: 'Open', bg: '#D1FAE5', fg: '#065F46' },
  paused: { label: 'Paused', bg: '#FEF3C7', fg: '#92400E' },
  filled: { label: 'Filled', bg: '#DBEAFE', fg: '#1E40AF' },
  closed: { label: 'Closed', bg: '#E5E5E5', fg: '#404040' },
};

function ActionButton({
  label,
  onPress,
  outline,
  disabled,
}: {
  label: string;
  onPress: () => void;
  outline?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.action, outline ? styles.actionOutline : styles.actionGold, disabled && styles.disabled]}>
      <Text style={[styles.actionText, outline && styles.actionTextOutline]}>{label}</Text>
    </Pressable>
  );
}

// The poster's view of their own job: change its status and decide on each applicant.
export function ManageJobScreen() {
  const { params } = useRoute<Rt>();
  const id = params.jobId;
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(
    () =>
      apiFetch<{ job: Job; applications: JobApplication[] }>(`/jobs/${id}/applicants`)
        .then(d => {
          setJob(d.job);
          setApplications(d.applications || []);
        })
        .catch(e => setError(e.message || 'Could not load this job'))
        .finally(() => setLoading(false)),
    [id],
  );

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (status: JobStatus) => {
    setError('');
    try {
      const d = await apiFetch<{ job: Job }>(`/jobs/${id}`, { method: 'PATCH', body: { status } });
      setJob(d.job);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const decide = async (application: JobApplication, status: ApplicationStatus) => {
    setBusyId(application._id);
    setError('');
    try {
      const d = await apiFetch<{ job: Job; application: JobApplication }>(
        `/jobs/${id}/applications/${application._id}`,
        { method: 'PATCH', body: { status } },
      );
      setJob(d.job);
      setApplications(prev => prev.map(a => (a._id === application._id ? d.application : a)));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading || !job) {
    return (
      <Screen style={styles.noPadding} topColor={colors.navy}>
        <NavyHeader title="Your job" back="glass" large titleSize={17} />
        {loading ? <LoadingView /> : <ErrorView message={error || 'Job not found'} />}
      </Screen>
    );
  }

  const status = JOB_STATUS[job.status || 'active'] || JOB_STATUS.active;
  const isOpen = job.status === 'active' || job.status === 'paused';

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title={job.title || 'Your job'} back="glass" large titleSize={17} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.between}>
            <Text style={styles.cat}>{JOB_CATEGORY_LABEL[job.category]}</Text>
            <Text style={[styles.badge, { backgroundColor: status.bg, color: status.fg }]}>{status.label}</Text>
          </View>
          <Text style={styles.meta}>
            {job.city} · {job.jobType} · {job.hiredCount ?? 0}/{job.openings} hired
          </Text>
          {job.salaryText ? <Text style={styles.salary}>{job.salaryText}</Text> : null}
          <View style={styles.actions}>
            {job.status === 'active' ? <ActionButton label="Pause" onPress={() => setStatus('paused')} /> : null}
            {job.status === 'paused' ? <ActionButton label="Reopen" onPress={() => setStatus('active')} /> : null}
            {job.status !== 'closed' && job.status !== 'filled' ? (
              <ActionButton label="Close job" outline onPress={() => setStatus('closed')} />
            ) : null}
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.heading}>Applicants ({applications.length})</Text>
        {applications.length === 0 ? (
          <Text style={styles.empty}>No applications yet. People who apply will appear here.</Text>
        ) : (
          applications.map(a => {
            const badge = APPLICATION_LABEL[a.status] || APPLICATION_LABEL.applied;
            const busy = busyId === a._id;
            return (
              <View key={a._id} style={[styles.card, styles.gap]}>
                <View style={styles.between}>
                  <View style={styles.flex}>
                    <Text style={styles.name} numberOfLines={1}>
                      {a.applicantName || 'Applicant'}
                    </Text>
                    <Text style={styles.small}>{a.applicantModel === 'Provider' ? 'Service provider' : 'User'}</Text>
                  </View>
                  <Text style={[styles.badge, { backgroundColor: badge.bg, color: badge.fg }]}>{badge.label}</Text>
                </View>
                {a.applicantPhone ? (
                  <Pressable style={styles.inline} onPress={() => Linking.openURL(`tel:${a.applicantPhone}`)}>
                    <Phone color="#047857" size={14} />
                    <Text style={styles.phone}>{a.applicantPhone}</Text>
                  </Pressable>
                ) : null}
                {a.coverNote ? <Text style={styles.note}>“{a.coverNote}”</Text> : null}
                {a.resume?.url ? (
                  <Pressable onPress={() => Linking.openURL(getMediaUrl(a.resume?.url) || '')}>
                    <Text style={styles.link}>
                      View resume{a.resume.filename ? ` (${a.resume.filename})` : ''}
                    </Text>
                  </Pressable>
                ) : null}
                <View style={styles.actions}>
                  {a.status !== 'hired' && isOpen ? (
                    <ActionButton label="Hire" disabled={busy} onPress={() => decide(a, 'hired')} />
                  ) : null}
                  {a.status !== 'shortlisted' && a.status !== 'hired' ? (
                    <ActionButton label="Shortlist" outline disabled={busy} onPress={() => decide(a, 'shortlisted')} />
                  ) : null}
                  {a.status !== 'rejected' && a.status !== 'hired' ? (
                    <ActionButton label="Not selected" outline disabled={busy} onPress={() => decide(a, 'rejected')} />
                  ) : null}
                  {a.status === 'hired' ? (
                    <ActionButton label="Undo hire" outline disabled={busy} onPress={() => decide(a, 'shortlisted')} />
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1, minWidth: 0 },
  gap: { gap: 8 },
  content: { padding: spacing.md, gap: 12, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cat: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  meta: { fontSize: 13, color: '#525252', marginTop: 8 },
  salary: { fontSize: 14, fontWeight: '700', color: colors.foreground, marginTop: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  action: { height: 36, borderRadius: radius.md, paddingHorizontal: 12, justifyContent: 'center' },
  actionGold: { backgroundColor: colors.primary },
  actionOutline: { borderWidth: 1, borderColor: colors.navy },
  actionText: { fontSize: 12, fontWeight: '700', color: colors.white },
  actionTextOutline: { color: colors.navy },
  disabled: { opacity: 0.5 },
  error: { fontSize: 12, color: colors.destructive },
  heading: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  empty: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
    padding: spacing.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D8D3C5',
    borderRadius: radius.lg,
    backgroundColor: colors.card,
  },
  name: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  small: { fontSize: 11, color: colors.mutedForeground },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  phone: { fontSize: 12, fontWeight: '600', color: '#047857' },
  note: { fontSize: 12, color: '#404040' },
  link: { fontSize: 12, fontWeight: '600', color: colors.primary, textDecorationLine: 'underline' },
});
