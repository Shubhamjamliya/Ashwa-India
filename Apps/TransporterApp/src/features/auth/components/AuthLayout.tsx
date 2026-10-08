import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { colors, radius, spacing } from '../../../theme/colors';

// The web transporter login: an "A" badge, the app name, then one white card for the current step.
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Screen style={styles.noPadding}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>A</Text>
            </View>
            <Text style={styles.title}>Ashwa India Transporter</Text>
            <Text style={styles.subtitle}>Receive and respond to transport requests</Text>
          </View>
          <View style={styles.card}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

// Labelled text box with an icon inside on the left.
export function IconInput({
  label,
  icon: Icon,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string; icon: React.ComponentType<{ color: string; size: number }> }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Icon color="#A3A3A3" size={16} />
        <TextInput placeholderTextColor={colors.mutedForeground} style={styles.input} {...props} />
      </View>
    </View>
  );
}

export const authStyles = StyleSheet.create({
  error: { fontSize: 14, color: colors.destructive },
  gap: { gap: spacing.md },
});

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.md, paddingVertical: 40 },
  brand: { alignItems: 'center', marginBottom: spacing.lg },
  badge: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badgeText: { fontSize: 18, fontWeight: '700', color: colors.white },
  title: { fontSize: 20, fontWeight: '700', color: colors.foreground },
  subtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 2 },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: colors.card,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  label: { fontSize: 12, fontWeight: '600', color: '#404040', marginBottom: 6 },
  inputWrap: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
  },
  input: { flex: 1, fontSize: 14, color: colors.foreground, paddingVertical: 0 },
});
