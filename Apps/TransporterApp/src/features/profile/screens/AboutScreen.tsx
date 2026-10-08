import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Globe, Share2, Users } from 'lucide-react-native';
import { Screen } from '../../../components/Screen';
import { LightHeader } from '../../../components/LightHeader';
import { colors, radius, spacing } from '../../../theme/colors';

export function AboutScreen() {
  const social = (Icon: typeof Globe, url: string) => (
    <Pressable style={styles.social} onPress={() => Linking.openURL(url)}>
      <Icon color={colors.primary} size={18} />
    </Pressable>
  );

  return (
    <Screen style={styles.noPadding}>
      <LightHeader title="About Ashwa India" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brand}>
          <Text style={styles.brandName}>
            Ashwa<Text style={styles.gold}>India</Text>
          </Text>
          <Text style={styles.tagline}>Transporter</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        <Text style={styles.paragraph}>
          Ashwa India connects horse owners with trusted transporters across the country. Receive transport enquiries
          from users near you, accept the jobs that suit you, and get paid straight to your wallet.
        </Text>

        <View style={styles.socials}>
          {social(Globe, 'https://ashwaindia.com')}
          {social(Users, 'https://instagram.com')}
          {social(Share2, 'https://facebook.com')}
        </View>

        <Text style={styles.footer}>© {new Date().getFullYear()} Ashwa India. All rights reserved.</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  brand: { alignItems: 'center', borderRadius: radius.lg, backgroundColor: colors.navy, paddingVertical: spacing.lg, marginBottom: spacing.lg },
  brandName: { fontSize: 24, fontWeight: '800', color: colors.white },
  gold: { color: colors.primary },
  tagline: { fontSize: 12, color: colors.navyMuted, marginTop: 4 },
  version: { fontSize: 11, color: colors.navyMuted, marginTop: spacing.sm },
  paragraph: { fontSize: 14, lineHeight: 21, color: colors.foreground, marginBottom: spacing.md },
  socials: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  social: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  footer: { fontSize: 11, color: colors.mutedForeground, textAlign: 'center', marginTop: spacing.xl },
});
