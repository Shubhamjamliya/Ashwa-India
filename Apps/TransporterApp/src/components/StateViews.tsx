import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

export function LoadingView({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.center, compact && styles.compact]}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

export function ErrorView({ message }: { message: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.error}>{message}</Text>
    </View>
  );
}

export function EmptyView({ icon, title, text }: { icon?: React.ReactNode; title: string; text?: string }) {
  return (
    <View style={styles.center}>
      {icon}
      <Text style={styles.title}>{title}</Text>
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
}

// Dashed white card used for "nothing here yet" blocks inside a page.
export function DashedEmpty({ icon, title, text }: { icon?: React.ReactNode; title?: string; text: string }) {
  return (
    <View style={styles.dashed}>
      {icon}
      {title ? <Text style={styles.dashedTitle}>{title}</Text> : null}
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.xl,
    paddingVertical: 64,
  },
  compact: { paddingVertical: 40 },
  error: { fontSize: 14, color: colors.destructive, textAlign: 'center' },
  title: { fontSize: 14, fontWeight: '600', color: colors.foreground, textAlign: 'center' },
  text: { fontSize: 13, color: colors.mutedForeground, textAlign: 'center' },
  dashed: {
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D8D3C5',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: 40,
  },
  dashedTitle: { fontSize: 14, fontWeight: '600', color: colors.foreground },
});
