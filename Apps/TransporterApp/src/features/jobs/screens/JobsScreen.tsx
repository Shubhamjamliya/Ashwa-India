import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Bookmark, BookmarkCheck, Briefcase, MapPin, Search } from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { EmptyView, LoadingView } from '../../../components/StateViews';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import type { AppStackParamList } from '../../../navigation/types';
import { APPLICATION_LABEL, JOB_CATEGORY_LABEL, type Job, type JobApplication } from '../types';

type Nav = NativeStackNavigationProp<AppStackParamList, 'Jobs'>;
type Tab = 'browse' | 'applied' | 'saved' | 'posted';

const TABS: { key: Tab; label: string }[] = [
  { key: 'browse', label: 'Browse' },
  { key: 'applied', label: 'Applied' },
  { key: 'saved', label: 'Saved' },
  { key: 'posted', label: 'Posted' },
];

// Transporters see driver jobs only (the web locks the category the same way).
const category = 'driver';

export function JobsScreen() {
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState<Tab>('browse');
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [saved, setSaved] = useState<Job[]>([]);
  const [posted, setPosted] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    let request: Promise<unknown>;
    if (tab === 'browse') {
      const qs = [
        category && `category=${category}`,
        query.trim() && `q=${encodeURIComponent(query.trim())}`,
        city.trim() && `city=${encodeURIComponent(city.trim())}`,
      ]
        .filter(Boolean)
        .join('&');
      request = apiFetch<{ jobs: Job[] }>(`/jobs${qs ? `?${qs}` : ''}`).then(d => setJobs(d.jobs || []));
    } else if (tab === 'applied') {
      request = apiFetch<{ applications: JobApplication[] }>('/jobs/mine/applications').then(d =>
        setApplications(d.applications || []),
      );
    } else if (tab === 'posted') {
      request = apiFetch<{ jobs: Job[] }>('/jobs/mine/posted').then(d => setPosted(d.jobs || []));
    } else {
      request = apiFetch<{ jobs: Job[] }>('/jobs/mine/saved').then(d => setSaved(d.jobs || []));
    }
    return request.catch(e => setError(e.message || 'Could not load jobs')).finally(() => setLoading(false));
  }, [tab, query, city]);

  // Typing in the search boxes reloads after a short pause rather than on every key.
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  // Coming back from a job (applied, saved, posted) should show the latest state.
  const loadRef = useRef(load);
  loadRef.current = load;
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      loadRef.current();
    }, []),
  );

  const toggleSave = async (job: Job) => {
    try {
      const d = await apiFetch<{ saved: boolean }>(`/jobs/${job._id}/save`, { method: 'POST' });
      setJobs(prev => prev.map(j => (j._id === job._id ? { ...j, saved: d.saved } : j)));
      if (!d.saved) setSaved(prev => prev.filter(j => j._id !== job._id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const openJob = (id: string) => navigation.navigate('JobDetail', { jobId: id });

  const renderBody = () => {
    if (loading) return <LoadingView />;
    if (tab === 'browse' || tab === 'saved') {
      const list = tab === 'browse' ? jobs : saved;
      return (
        <FlatList
          data={list}
          keyExtractor={j => j._id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyView
              title={
                tab === 'browse' ? 'No jobs match right now. Try another category or city.' : 'Jobs you bookmark show up here.'
              }
            />
          }
          renderItem={({ item }) => (
            <JobCard job={item} onOpen={() => openJob(item._id)} onSave={() => toggleSave(item)} />
          )}
        />
      );
    }
    if (tab === 'posted') {
      return (
        <FlatList
          data={posted}
          keyExtractor={j => j._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyView title="Jobs you post show up here. Tap “+ Post job” to hire." />}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => navigation.navigate('ManageJob', { jobId: item._id })}>
              <View style={styles.cardTop}>
                <View style={styles.flex}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.sub}>
                    {JOB_CATEGORY_LABEL[item.category]} · {item.city} · {item.hiredCount ?? 0}/{item.openings} hired
                  </Text>
                </View>
                <Text style={[styles.badge, styles.goldBadge]}>
                  {item.applicants ?? 0} applicant{item.applicants === 1 ? '' : 's'}
                </Text>
              </View>
            </Pressable>
          )}
        />
      );
    }
    return (
      <FlatList
        data={applications}
        keyExtractor={a => a._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyView title="You have not applied for any job yet." />}
        renderItem={({ item: a }) => {
          const badge = APPLICATION_LABEL[a.status] || APPLICATION_LABEL.applied;
          return (
            <Pressable style={styles.card} onPress={() => a.job && openJob(a.job._id)}>
              <View style={styles.cardTop}>
                <View style={styles.flex}>
                  <Text style={styles.title} numberOfLines={1}>
                    {a.job?.title || 'Job'}
                  </Text>
                  <Text style={styles.sub}>
                    {a.job?.employer?.name} · {a.job?.city}
                  </Text>
                </View>
                <Text style={[styles.badge, { backgroundColor: badge.bg, color: badge.fg }]}>{badge.label}</Text>
              </View>
            </Pressable>
          );
        }}
      />
    );
  };

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader
        title={`${JOB_CATEGORY_LABEL.driver} Jobs`}
        back="glass"
        subtitle="Find driver work, or post a driver job and hire"
        right={
          <Pressable style={styles.postBtn} onPress={() => navigation.navigate('PostJob')}>
            <Text style={styles.postBtnText}>+ Post job</Text>
          </Pressable>
        }
      />

      <View style={styles.tabs}>
        {TABS.map(t => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tab, tab === t.key && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'browse' ? (
        <View style={styles.filters}>
          <View style={styles.searchWrap}>
            <Search color="#A3A3A3" size={16} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search jobs"
              placeholderTextColor={colors.mutedForeground}
              style={styles.searchInput}
            />
          </View>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="City"
            placeholderTextColor={colors.mutedForeground}
            style={styles.cityInput}
          />
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.flex}>{renderBody()}</View>
    </Screen>
  );
}

function JobCard({ job, onOpen, onSave }: { job: Job; onOpen: () => void; onSave: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onOpen}>
      <View style={styles.cardTop}>
        <View style={styles.flex}>
          <View style={styles.catRow}>
            <Briefcase color={colors.primary} size={14} />
            <Text style={styles.cat}>{JOB_CATEGORY_LABEL[job.category] || job.category}</Text>
          </View>
          <Text style={[styles.title, styles.mt4]} numberOfLines={1}>
            {job.title}
          </Text>
          <Text style={styles.sub}>{job.employer?.name || 'Employer'}</Text>
        </View>
        <Pressable onPress={onSave} hitSlop={10}>
          {job.saved ? (
            <BookmarkCheck color={colors.primary} size={20} />
          ) : (
            <Bookmark color="#A3A3A3" size={20} />
          )}
        </Pressable>
      </View>
      <View style={styles.metaRow}>
        <View style={styles.catRow}>
          <MapPin color="#525252" size={14} />
          <Text style={styles.meta}>{job.city}</Text>
        </View>
        <Text style={styles.meta}>{job.jobType}</Text>
        {job.experienceYears > 0 ? <Text style={styles.meta}>{job.experienceYears}+ yrs</Text> : null}
        {job.salaryText ? <Text style={[styles.meta, styles.bold]}>{job.salaryText}</Text> : null}
      </View>
      {job.applicationStatus ? (
        <Text style={styles.appliedNote}>
          You applied · {APPLICATION_LABEL[job.applicationStatus]?.label || job.applicationStatus}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1, minWidth: 0 },
  mt4: { marginTop: 4 },
  bold: { fontWeight: '700', color: colors.foreground },
  postBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8 },
  postBtnText: { fontSize: 12, fontWeight: '700', color: colors.white },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: colors.foreground },
  tabTextActive: { color: colors.white },
  filters: { gap: 10, paddingHorizontal: spacing.md, paddingTop: 12 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.foreground, paddingVertical: 0 },
  cityInput: {
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: 14,
    color: colors.foreground,
  },
  error: { fontSize: 12, color: colors.destructive, paddingHorizontal: spacing.md, paddingTop: 8 },
  list: { padding: spacing.md, gap: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cat: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  sub: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, rowGap: 4, marginTop: 8 },
  meta: { fontSize: 12, color: '#525252' },
  appliedNote: { fontSize: 11, fontWeight: '700', color: '#1D4ED8', marginTop: 8 },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  goldBadge: { backgroundColor: colors.accent, color: colors.accentForeground },
});
