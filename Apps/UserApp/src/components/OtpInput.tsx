import React, { useRef } from 'react';
import { NativeSyntheticEvent, StyleSheet, TextInput, View } from 'react-native';
import { colors, radius } from '../theme/colors';

type TextInputRef = React.ComponentRef<typeof TextInput>;

type Props = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
};

export function OtpInput({ length = 6, value, onChange, autoFocus }: Props) {
  const inputs = useRef<Array<TextInputRef | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const setDigit = (index: number, text: string) => {
    const clean = text.replace(/\D/g, '');
    if (!clean) {
      // backspace clearing an already-empty box falls through to onKeyPress
      const next = value.slice(0, index) + value.slice(index + 1);
      onChange(next);
      return;
    }
    // Handles pasted multi-digit strings by spreading across remaining boxes.
    const chars = clean.split('');
    const next = value.split('');
    chars.forEach((c, i) => {
      next[index + i] = c;
    });
    onChange(next.join('').slice(0, length));
    const target = Math.min(index + chars.length, length - 1);
    inputs.current[target]?.focus();
  };

  const handleKeyPress = (index: number, e: NativeSyntheticEvent<{ key: string }>) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      onChange(value.slice(0, index - 1) + value.slice(index));
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={ref => {
            inputs.current[index] = ref;
          }}
          style={[styles.box, digit && styles.boxFilled]}
          value={digit}
          onChangeText={text => setDigit(index, text)}
          onKeyPress={e => handleKeyPress(index, e)}
          keyboardType="number-pad"
          maxLength={2}
          autoFocus={autoFocus && index === 0}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  box: {
    width: 46,
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  boxFilled: {
    borderColor: colors.primary,
  },
});
