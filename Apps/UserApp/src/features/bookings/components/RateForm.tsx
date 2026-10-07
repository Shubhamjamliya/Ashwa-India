import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { StarPicker } from '../../../components/Stars';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';

// Star rating + optional comment for a finished trip or service.
// endpoint is the review URL, e.g. /transport/requests/:id/review.
export function RateForm({
  endpoint,
  question,
  thanks,
  reviewed,
}: {
  endpoint: string;
  question: string;
  thanks: string;
  reviewed?: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(Boolean(reviewed));
  const [error, setError] = useState('');

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      await apiFetch(endpoint, { method: 'POST', body: { rating, comment } });
      setDone(true);
    } catch (e: any) {
      setError(e.message || 'Could not save your review');
    } finally {
      setSaving(false);
    }
  };

  if (done) return <Text style={styles.thanks}>{thanks}</Text>;

  return (
    <View style={styles.wrap}>
      <Text style={styles.question}>{question}</Text>
      <StarPicker value={rating} onChange={setRating} />
      {rating > 0 ? (
        <>
          <TextInput
            value={comment}
            onChangeText={setComment}
            multiline
            placeholder="Share a few words (optional)"
            placeholderTextColor={colors.mutedForeground}
            style={styles.textarea}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={[styles.btn, saving && styles.disabled]} disabled={saving} onPress={submit}>
            <Text style={styles.btnText}>{saving ? 'Saving...' : 'Submit rating'}</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  question: { fontSize: 12, fontWeight: '700', color: colors.foreground },
  textarea: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.foreground,
    textAlignVertical: 'top',
  },
  error: { fontSize: 12, color: colors.destructive },
  btn: { backgroundColor: colors.navy, borderRadius: radius.md, paddingVertical: 11, alignItems: 'center' },
  btnText: { fontSize: 14, fontWeight: '700', color: colors.white },
  disabled: { opacity: 0.5 },
  thanks: { marginTop: 12, textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#047857' },
});
