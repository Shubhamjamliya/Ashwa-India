import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { DateTimeField } from '../../../components/DateTimeField';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';

// Ask the seller for a visit to see the horse. Used on the horse page and inside the chat.
export function VisitRequestForm({ horseId, onSent }: { horseId: string; onSent: () => void }) {
  const [visitAt, setVisitAt] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!visitAt) {
      setError('Pick a date and time');
      return;
    }
    setSending(true);
    try {
      await apiFetch('/marketplace/visits', {
        method: 'POST',
        body: { horseId, preferredAt: visitAt, message: note.trim() || undefined },
      });
      onSent();
    } catch (e: any) {
      setError(e.message || 'Could not send the visit request');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <DateTimeField value={visitAt} onChange={setVisitAt} />
      <TextInput
        value={note}
        onChangeText={setNote}
        multiline
        placeholder="Anything the seller should know (optional)"
        placeholderTextColor={colors.mutedForeground}
        style={styles.textarea}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={[styles.btn, sending && styles.disabled]} disabled={sending} onPress={submit}>
        <Text style={styles.btnText}>{sending ? 'Sending...' : 'Send visit request'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  textarea: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.foreground,
    textAlignVertical: 'top',
  },
  error: { fontSize: 12, color: colors.destructive },
  btn: { backgroundColor: colors.navy, borderRadius: radius.md, paddingVertical: 11, alignItems: 'center' },
  btnText: { fontSize: 13, fontWeight: '700', color: colors.white },
  disabled: { opacity: 0.5 },
});
