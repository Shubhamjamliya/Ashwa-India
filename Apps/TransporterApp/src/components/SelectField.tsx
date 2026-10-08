import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { DateTimeField } from './DateTimeField';
import { colors, radius, spacing } from '../theme/colors';

// A dropdown that looks like the web's <select>: a field showing the current choice, opening a
// bottom sheet of options.
export function SelectField<T extends string>({
  value,
  options,
  onChange,
  title,
  style,
  placeholder,
  disabled = false,
  capitalize = false,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  title: string;
  style?: StyleProp<ViewStyle>;
  placeholder?: string;
  disabled?: boolean;
  capitalize?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.value === value);

  return (
    <>
      <Pressable style={[styles.field, disabled && styles.fieldDisabled, style]} disabled={disabled} onPress={() => setOpen(true)}>
        <Text
          style={[styles.value, capitalize && styles.capitalize, !current && styles.placeholder]}
          numberOfLines={1}>
          {current?.label ?? placeholder ?? ''}
        </Text>
        <ChevronDown color={colors.mutedForeground} size={16} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <ScrollView>
              {options.map(o => (
                <Pressable
                  key={o.value}
                  style={styles.row}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}>
                  <Text style={[styles.rowText, capitalize && styles.capitalize, o.value === value && styles.rowTextActive]}>
                    {o.label}
                  </Text>
                  {o.value === value ? <Check color={colors.primary} size={16} /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

// A date box like the web's <input type="date"> (or "datetime-local" with withTime), picking from
// a bottom sheet.
export function DateField({
  value,
  onChange,
  placeholder,
  days = 60,
  withTime = false,
  disabled = false,
  style,
}: {
  value: string;
  onChange: (iso: string) => void;
  placeholder: string;
  days?: number;
  withTime?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [open, setOpen] = useState(false);
  const shown = value
    ? withTime
      ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : new Date(value).toLocaleDateString('en-IN')
    : placeholder;
  return (
    <>
      <Pressable style={[styles.field, disabled && styles.fieldDisabled, style]} disabled={disabled} onPress={() => setOpen(true)}>
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {shown}
        </Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>{placeholder}</Text>
            <View style={styles.datePad}>
              <DateTimeField
                value={value}
                onChange={iso => {
                  onChange(iso);
                  // A date alone is done in one tap; with a time, wait for the time slot and Done.
                  if (!withTime) setOpen(false);
                }}
                days={days}
                withTime={withTime}
              />
            </View>
            <View style={styles.sheetActions}>
              {value ? (
                <Pressable
                  onPress={() => {
                    onChange('');
                    setOpen(false);
                  }}>
                  <Text style={styles.clearText}>{withTime ? 'Clear' : 'Clear date'}</Text>
                </Pressable>
              ) : (
                <View />
              )}
              {withTime ? (
                <Pressable onPress={() => setOpen(false)}>
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              ) : null}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
  },
  fieldDisabled: { opacity: 0.6 },
  value: { flex: 1, fontSize: 14, color: colors.foreground },
  capitalize: { textTransform: 'capitalize' },
  placeholder: { color: colors.mutedForeground, textTransform: 'none' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '60%',
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.foreground, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowText: { fontSize: 14, color: colors.foreground },
  rowTextActive: { fontWeight: '700', color: colors.primary },
  datePad: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  sheetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
  },
  clearText: { fontSize: 13, fontWeight: '700', color: colors.destructive },
  doneText: { fontSize: 14, fontWeight: '700', color: colors.primary },
});
