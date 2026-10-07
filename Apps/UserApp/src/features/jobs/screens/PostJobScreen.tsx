import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { DateField, SelectField } from '../../../components/SelectField';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import type { HomeStackParamList } from '../../../navigation/types';
import { JOB_CATEGORY_LABEL, type Job, type JobCategory } from '../types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'PostJob'>;

const JOB_TYPES = ['full-time', 'part-time', 'contract', 'freelance'].map(t => ({ value: t, label: t }));
const CATEGORIES = (Object.entries(JOB_CATEGORY_LABEL) as [JobCategory, string][]).map(([value, label]) => ({
  value,
  label,
}));

const EMPTY = {
  title: '',
  category: 'trainer' as JobCategory,
  jobType: 'full-time',
  city: '',
  address: '',
  experienceYears: '0',
  salaryText: '',
  openings: '1',
  deadline: '',
  description: '',
  requirements: '',
};

// Post a job and go straight to managing its applicants.
export function PostJobScreen() {
  const navigation = useNavigation<Nav>();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.title.trim() || !form.city.trim() || !form.description.trim()) {
      setError('Job title, city and description are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const d = await apiFetch<{ job: Job }>('/jobs', {
        method: 'POST',
        body: {
          ...form,
          experienceYears: Number(form.experienceYears) || 0,
          openings: Number(form.openings) || 1,
          deadline: form.deadline ? form.deadline.slice(0, 10) : undefined,
        },
      });
      navigation.replace('ManageJob', { jobId: d.job._id });
    } catch (e: any) {
      setError(e.message || 'Could not post the job');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title="Post a job" subtitle="Find a trainer, groom, rider or vet" back="glass" large />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextInput
            style={styles.input}
            placeholder="Job title *"
            placeholderTextColor={colors.mutedForeground}
            value={form.title}
            onChangeText={v => set('title', v)}
          />
          <View style={styles.row}>
            <SelectField
              title="Category"
              value={form.category}
              options={CATEGORIES}
              onChange={v => set('category', v)}
              style={styles.flex}
            />
            <SelectField
              title="Job type"
              value={form.jobType}
              options={JOB_TYPES}
              onChange={v => set('jobType', v)}
              style={styles.flex}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="City *"
              placeholderTextColor={colors.mutedForeground}
              value={form.city}
              onChangeText={v => set('city', v)}
            />
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="Stable / address"
              placeholderTextColor={colors.mutedForeground}
              value={form.address}
              onChangeText={v => set('address', v)}
            />
          </View>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.label}>Years exp.</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                placeholder="Years exp."
                placeholderTextColor={colors.mutedForeground}
                value={form.experienceYears}
                onChangeText={v => set('experienceYears', v.replace(/\D/g, ''))}
              />
            </View>
            <View style={styles.flex}>
              <Text style={styles.label}>Openings</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                placeholder="Openings"
                placeholderTextColor={colors.mutedForeground}
                value={form.openings}
                onChangeText={v => set('openings', v.replace(/\D/g, ''))}
              />
            </View>
            <View style={styles.flex}>
              <Text style={styles.label}>Apply by</Text>
              <DateField value={form.deadline} onChange={v => set('deadline', v)} placeholder="Apply by" />
            </View>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Pay, e.g. ₹20,000 - ₹28,000 / month"
            placeholderTextColor={colors.mutedForeground}
            value={form.salaryText}
            onChangeText={v => set('salaryText', v)}
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            multiline
            placeholder="Describe the work *"
            placeholderTextColor={colors.mutedForeground}
            value={form.description}
            onChangeText={v => set('description', v)}
          />
          <TextInput
            style={[styles.input, styles.textareaSm]}
            multiline
            placeholder="What you are looking for"
            placeholderTextColor={colors.mutedForeground}
            value={form.requirements}
            onChangeText={v => set('requirements', v)}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={[styles.submit, saving && styles.disabled]} disabled={saving} onPress={submit}>
            <Text style={styles.submitText}>{saving ? 'Posting...' : 'Post job'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1, minWidth: 0 },
  content: { gap: 12, padding: spacing.md, paddingBottom: spacing.xl },
  row: { flexDirection: 'row', gap: spacing.sm },
  label: { fontSize: 11, fontWeight: '600', color: colors.mutedForeground, marginBottom: 4 },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.foreground,
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  textareaSm: { minHeight: 76, textAlignVertical: 'top' },
  error: { fontSize: 12, color: colors.destructive },
  submit: {
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { fontSize: 14, fontWeight: '700', color: colors.white },
  disabled: { opacity: 0.5 },
});
