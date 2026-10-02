import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Button } from '../../../components/Button';
import { colors, radius, spacing } from '../../../theme/colors';

type Props = {
  onEnableLocation: () => void;
  checking?: boolean;
  error?: string | null;
};

export function LocationRequiredScreen({ onEnableLocation, checking, error }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.iconWrap}>
        <MapPin color={colors.primary} size={40} />
      </View>
      <Text style={styles.title}>Turn on location</Text>
      <Text style={styles.message}>
        We use your location to check if Ashwa India is available in your area yet.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        title={checking ? 'Checking...' : 'Enable Location'}
        onPress={onEnableLocation}
        loading={checking}
        style={styles.btn}
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
  error: {
    fontSize: 13,
    color: colors.destructive,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  btn: {
    marginTop: spacing.xl,
    minWidth: 180,
  },
});
