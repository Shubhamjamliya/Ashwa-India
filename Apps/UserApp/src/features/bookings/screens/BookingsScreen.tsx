import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { Screen } from '../../../components/Screen';
import { colors, spacing } from '../../../theme/colors';

export function BookingsScreen() {
  return (
    <Screen style={styles.screen}>
      <View style={styles.center}>
        <Calendar color={colors.mutedForeground} size={32} />
        <Text style={styles.title}>No bookings yet</Text>
        <Text style={styles.text}>
          Your service, transport and marketplace bookings will show up here.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: 8,
  },
  text: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
