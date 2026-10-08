import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, radius } from '../theme/colors';

// Compact text box used by the web's management forms (vehicles, drivers, KYC, trip setup).
export function TextField({
  label,
  style,
  inputStyle,
  ...props
}: React.ComponentProps<typeof TextInput> & {
  label?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: React.ComponentProps<typeof TextInput>['style'];
}) {
  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, props.editable === false && styles.inputDisabled, inputStyle]}
        {...props}
      />
    </View>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

// Amber checkbox with a label (the web's accent-amber-600 checkboxes).
export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable style={styles.checkRow} onPress={() => onChange(!checked)} hitSlop={6}>
      <View style={[styles.box, checked && styles.boxOn]}>{checked ? <Check color={colors.white} size={12} strokeWidth={3} /> : null}</View>
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

// Small outlined gold action ("Upload", "Replace") used on document rows.
export function UploadChip({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.chip, disabled && styles.disabled]} hitSlop={6}>
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', color: '#404040', marginBottom: 4 },
  input: {
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: 14,
    color: colors.foreground,
  },
  inputDisabled: { backgroundColor: '#FAFAFA', color: colors.mutedForeground },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  box: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#A3A3A3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: '#D97706', borderColor: '#D97706' },
  checkLabel: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  chip: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  disabled: { opacity: 0.5 },
});
