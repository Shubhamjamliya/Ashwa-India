import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme/colors';

export function LoadingView() {
  return (
    <View style={styles.center}>
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

export function EmptyView({
  icon,
  title,
  text,
}: {
  icon?: React.ReactNode;
  title: string;
  text?: string;
}) {
  return (
    <View style={styles.center}>
      {icon}
      <Text style={styles.title}>{title}</Text>
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.xl,
    paddingVertical: 72,
  },
  error: {
    fontSize: 14,
    color: colors.destructive,
    textAlign: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    textAlign: 'center',
  },
  text: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
});
