import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Bookmark, BookmarkCheck, CheckCircle2, MapPin, Phone, Upload } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { ErrorView, LoadingView } from '../../../components/StateViews';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { pickPdf, uploadFile } from '../../../services/files';
import type { HomeStackParamList } from '../../../navigation/types';
import { APPLICATION_LABEL, JOB_CATEGORY_LABEL, type Job, type JobApplication } from '../types';

type Resume = { url: string; filename?: string };

type Nav = NativeStackNavigationProp<HomeStackParamList, 'JobDetail'>;
type Rt = RouteProp<HomeStackParamList, 'JobDetail'>;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// Job detail with apply and save.
export function JobDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const id = params.jobId;
  const [job, setJob] = useState<Job | null>(null);
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPoster, setIsPoster] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showApply, setShowApply] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [resume, setResume] = useState<Resume | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiFetch<{ job: Job; application: JobApplication | null; saved: boolean; isPoster: boolean }>(`/jobs/${id}`)
      .then(d => {
        setJob(d.job);
        setApplication(d.application);
        setSaved(d.saved);
        setIsPoster(d.isPoster);
      })
      .catch(e => setError(e.message || 'Job not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleSave = async () => {
    try {
      const d = await apiFetch<{ saved: boolean }>(`/jobs/${id}/save`, { method: 'POST' });
      setSaved(d.saved);
    } catch (e: any) {
      setError(e.message);
    }
  };

  // The PDF is uploaded as soon as it is picked; the application then refers to it.
  const pickResume = async () => {
    setError('');
    try {
      const file = await pickPdf();
      if (!file) return;
      if (file.size && file.size > 5 * 1024 * 1024) {
        setError('Resume must be 5 MB or smaller');
        return;
      }
      setBusy(true);
      const d = await uploadFile<{ resume: Resume }>('/jobs/resume', file);
      setResume(d.resume);
    } catch (e: any) {
      setError(e.message || 'Could not upload the resume');
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    setBusy(true);
    setError('');
    try {
      const d = await apiFetch<{ application: JobApplication }>(`/jobs/${id}/apply`, {
        method: 'POST',
        body: { coverNote, resume: resume || undefined },
      });
      setApplication(d.application);
      setShowApply(false);
      setNotice('Application sent. The employer will review it.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const header = (
    <NavyHeader
      title={job?.title || 'Job'}
      back="glass"
      large
      titleSize={17}
      right={
        job ? (
          <Pressable onPress={toggleSave} hitSlop={10}>
            {saved ? <BookmarkCheck color={colors.primary} size={20} /> : <Bookmark color={colors.white} size={20} />}
          </Pressable>
        ) : undefined
      }
    />
  );

  if (loading || !job) {
    return (
      <Screen style={styles.noPadding} topColor={colors.navy}>
        {header}
        {loading ? <LoadingView /> : <ErrorView message={error || 'This job is no longer available.'} />}
      </Screen>
    );
  }

  // The poster's name and phone are what applicants see.
  const employer = { name: job.contact?.name || job.posterName, phone: job.contact?.phone || job.posterPhone };
  const applied = application ? APPLICATION_LABEL[application.status] || APPLICATION_LABEL.applied : null;

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      {header}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.card}>
            <Text style={styles.cat}>{JOB_CATEGORY_LABEL[job.category] || job.category}</Text>
            <Text style={styles.title}>{job.title}</Text>
            <Text style={styles.body}>{employer.name}</Text>
            <View style={styles.metaRow}>
              <View style={styles.inline}>
                <MapPin color="#525252" size={14} />
                <Text style={styles.meta}>{job.address ? `${job.address}, ${job.city}` : job.city}</Text>
              </View>
              <Text style={styles.meta}>{job.jobType}</Text>
              <Text style={styles.meta}>
                {job.openings} opening{job.openings === 1 ? '' : 's'}
              </Text>
              {job.experienceYears > 0 ? <Text style={styles.meta}>{job.experienceYears}+ years experience</Text> : null}
            </View>
            {job.salaryText ? <Text style={styles.salary}>{job.salaryText}</Text> : null}
            {job.deadline ? (
              <Text style={styles.deadline}>Apply by {new Date(job.deadline).toLocaleDateString('en-IN')}</Text>
            ) : null}
          </View>

          <Section title="About the job">
            <Text style={styles.body}>{job.description}</Text>
          </Section>
          {job.requirements ? (
            <Section title="Requirements">
              <Text style={styles.body}>{job.requirements}</Text>
            </Section>
          ) : null}

          <Section title="Posted by">
            <Text style={[styles.body, styles.bold]}>{employer.name || 'Member'}</Text>
            {employer.phone ? (
              <Pressable style={styles.callBtn} onPress={() => Linking.openURL(`tel:${employer.phone}`)}>
                <Phone color={colors.white} size={16} />
                <Text style={styles.btnText}>Call</Text>
              </Pressable>
            ) : null}
          </Section>

          {isPoster ? (
            <Pressable style={[styles.bigBtn, styles.navyBtn]} onPress={() => navigation.navigate('ManageJob', { jobId: id })}>
              <Text style={styles.btnText}>Manage applicants</Text>
            </Pressable>
          ) : applied ? (
            <View style={styles.appliedBox}>
              <CheckCircle2 color="#059669" size={20} />
              <View>
                <Text style={[styles.body, styles.bold]}>You applied for this job</Text>
                <Text style={[styles.badge, { backgroundColor: applied.bg, color: applied.fg }]}>{applied.label}</Text>
              </View>
            </View>
          ) : showApply ? (
            <View style={[styles.card, styles.gap]}>
              <Text style={[styles.body, styles.bold]}>Apply for this job</Text>
              <TextInput
                value={coverNote}
                onChangeText={setCoverNote}
                multiline
                maxLength={1000}
                placeholder="Why are you a good fit? (optional)"
                placeholderTextColor={colors.mutedForeground}
                style={styles.textarea}
              />
              <Pressable style={[styles.resumeBox, busy && styles.disabled]} disabled={busy} onPress={pickResume}>
                <Text style={styles.resumeText} numberOfLines={1}>
                  {resume ? `Resume: ${resume.filename || 'uploaded'}` : 'Upload resume (PDF, up to 5 MB)'}
                </Text>
                <Upload color={colors.primary} size={16} />
              </Pressable>
              <View style={styles.btnRow}>
                <Pressable style={[styles.halfBtn, styles.outlineBtn]} onPress={() => setShowApply(false)}>
                  <Text style={styles.outlineText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.halfBtn, styles.goldBtn, busy && styles.disabled]}
                  disabled={busy}
                  onPress={apply}>
                  <Text style={styles.btnText}>{busy ? 'Working...' : 'Send application'}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={[styles.bigBtn, styles.goldBtn]} onPress={() => setShowApply(true)}>
              <Text style={styles.btnText}>Apply now</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1 },
  gap: { gap: 12 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  notice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
    backgroundColor: '#ECFDF5',
    borderRadius: radius.md,
    padding: 12,
    overflow: 'hidden',
  },
  error: { fontSize: 12, color: colors.destructive },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground, marginBottom: 8 },
  cat: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.foreground, marginTop: 4 },
  body: { fontSize: 13, color: '#404040', lineHeight: 19 },
  bold: { fontWeight: '700', color: colors.foreground },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4, marginTop: 12 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 12, color: '#525252' },
  salary: { fontSize: 14, fontWeight: '700', color: colors.foreground, marginTop: 12 },
  deadline: { fontSize: 11, color: colors.mutedForeground, marginTop: 4 },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    marginTop: 12,
    borderRadius: radius.md,
    backgroundColor: '#059669',
  },
  btnText: { fontSize: 14, fontWeight: '700', color: colors.white },
  bigBtn: { height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  navyBtn: { backgroundColor: colors.navy },
  goldBtn: { backgroundColor: colors.primary },
  appliedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  badge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginTop: 4,
    overflow: 'hidden',
  },
  textarea: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.foreground,
    textAlignVertical: 'top',
  },
  resumeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    padding: 12,
  },
  resumeText: { flex: 1, fontSize: 12, fontWeight: '600', color: colors.foreground },
  btnRow: { flexDirection: 'row', gap: 8 },
  halfBtn: { flex: 1, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  outlineBtn: { borderWidth: 1, borderColor: colors.border },
  outlineText: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  disabled: { opacity: 0.5 },
});
