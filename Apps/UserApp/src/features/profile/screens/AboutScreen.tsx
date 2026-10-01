import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, Globe, Share2, Users } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { colors, radius, spacing } from '../../../theme/colors';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'About'>;

export function AboutScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <Screen style={styles.noPadding}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft color={colors.foreground} size={20} />
        </Pressable>
        <Text style={styles.title}>About Ashwa India</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brandCard}>
          <Text style={styles.brand}>
            Ashwa<Text style={styles.brandAccent}>India</Text>
          </Text>
          <Text style={styles.tagline}>India's Horse Network</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        <Text style={styles.paragraph}>
          Ashwa India connects horse buyers, sellers and service providers across the country.
          From trading horses to sourcing feed, tack and veterinary services, our mission is to
          build India's most trusted equine community — all in one app.
        </Text>

        <Text style={styles.paragraph}>
          Whether you're a breeder, a stable owner or a first-time buyer, Ashwa India gives you a
          transparent marketplace, verified sellers and a dedicated accessories store built for
          horse care.
        </Text>

        <View style={styles.socialRow}>
          <Pressable style={styles.socialBtn} onPress={() => Linking.openURL('https://ashwaindia.com')}>
            <Globe color={colors.primary} size={18} />
          </Pressable>
          <Pressable style={styles.socialBtn} onPress={() => Linking.openURL('https://instagram.com')}>
            <Users color={colors.primary} size={18} />
          </Pressable>
          <Pressable style={styles.socialBtn} onPress={() => Linking.openURL('https://facebook.com')}>
            <Share2 color={colors.primary} size={18} />
          </Pressable>
        </View>

        <Text style={styles.footer}>© {new Date().getFullYear()} Ashwa India. All rights reserved.</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  content: {
    padding: spacing.md,
    paddingTop: 0,
    paddingBottom: spacing.xl,
  },
  brandCard: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
  },
  brand: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.navyForeground,
  },
  brandAccent: {
    color: colors.primary,
  },
  tagline: {
    fontSize: 12,
    color: colors.navyMuted,
    marginTop: 4,
  },
  version: {
    fontSize: 11,
    color: colors.navyMuted,
    marginTop: spacing.sm,
  },
  paragraph: {
    fontSize: 14,
    color: colors.foreground,
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  socialRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  socialBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    fontSize: 11,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
