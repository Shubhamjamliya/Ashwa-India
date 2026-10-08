import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');

// A date box for expiry dates (licences, insurance): pick a year, month and day, which can be
// years ahead. Value is "YYYY-MM-DD" like the web's <input type="date">, or '' for none.
export function ExpiryDateField({
  value,
  onChange,
  placeholder = 'Expiry date',
  style,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const [y, m, d] = value ? value.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1, now.getDate()];
  const [year, setYear] = useState(y);
  const [month, setMonth] = useState(m);
  const [day, setDay] = useState(d);
  const daysInMonth = new Date(year, month, 0).getDate();
  const years = Array.from({ length: 21 }, (_, i) => now.getFullYear() - 5 + i);

  const openSheet = () => {
    setYear(y);
    setMonth(m);
    setDay(d);
    setOpen(true);
  };

  const save = () => {
    onChange(`${year}-${pad(month)}-${pad(Math.min(day, daysInMonth))}`);
    setOpen(false);
  };

  const chip = (label: string, active: boolean, onPress: () => void, key: string | number) => (
    <Pressable key={key} onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );

  return (
    <>
      <Pressable style={[styles.field, compact && styles.fieldCompact, style]} onPress={openSheet}>
        <Text style={[styles.value, compact && styles.valueCompact, !value && styles.placeholder]} numberOfLines={1}>
          {value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-IN') : placeholder}
        </Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>{placeholder}</Text>
            <Text style={styles.group}>Year</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {years.map(v => chip(String(v), v === year, () => setYear(v), v))}
            </ScrollView>
            <Text style={styles.group}>Month</Text>
            <View style={styles.wrap}>{MONTHS.map((label, i) => chip(label, i + 1 === month, () => setMonth(i + 1), label))}</View>
            <Text style={styles.group}>Day</Text>
            <View style={styles.wrap}>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(v => chip(String(v), v === day, () => setDay(v), v))}
            </View>
            <View style={styles.actions}>
              {value ? (
                <Pressable
                  onPress={() => {
                    onChange('');
                    setOpen(false);
                  }}>
                  <Text style={styles.clear}>Clear</Text>
                </Pressable>
              ) : (
                <View />
              )}
              <Pressable onPress={save}>
                <Text style={styles.done}>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 40,
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
  },
  fieldCompact: { height: 32, borderRadius: 6, paddingHorizontal: 6 },
  value: { fontSize: 14, color: colors.foreground },
  valueCompact: { fontSize: 11 },
  placeholder: { color: colors.mutedForeground },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.foreground, marginBottom: spacing.sm },
  group: { fontSize: 11, fontWeight: '700', color: colors.mutedForeground, marginTop: spacing.sm, marginBottom: 6 },
  row: { gap: 6 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    minWidth: 40,
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.foreground },
  chipTextActive: { color: colors.white },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  clear: { fontSize: 13, fontWeight: '700', color: colors.destructive },
  done: { fontSize: 14, fontWeight: '700', color: colors.primary },
});
