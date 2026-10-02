import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MapPinOff } from 'lucide-react-native';
import { Button } from '../../../components/Button';
import { colors, radius, spacing } from '../../../theme/colors';

type Props = {
  zoneLabel?: string | null;
  onRetry: () => void;
  retrying?: boolean;
};

export function ComingSoonScreen({ zoneLabel, onRetry, retrying }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.iconWrap}>
        <MapPinOff color={colors.primary} size={40} />
      </View>
      <Text style={styles.title}>We're not available here yet</Text>
      <Text style={styles.message}>
        {zoneLabel
          ? `Ashwa India isn't live in ${zoneLabel} right now.`
          : "Ashwa India isn't available at your current location right now."}
      </Text>
      <Text style={styles.comingSoon}>We are coming soon!!</Text>

      <Button
        title={retrying ? 'Checking...' : 'Check Again'}
        onPress={onRetry}
        loading={retrying}
        style={styles.retryBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.foreground,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  comingSoon: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  retryBtn: {
    marginTop: spacing.xl,
    minWidth: 180,
  },
});
