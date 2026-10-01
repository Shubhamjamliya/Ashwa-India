import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, ChevronDown, Mail, MessageCircle, Phone } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { colors, radius, spacing } from '../../../theme/colors';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'HelpSupport'>;

const SUPPORT_PHONE = '+911234567890';
const SUPPORT_EMAIL = 'support@ashwaindia.com';

const faqs = [
  {
    q: 'How do I list my horse for sale?',
    a: 'Register as a horse seller from the login screen, then add your listing from the seller dashboard with photos, breed, price and description.',
  },
  {
    q: 'How do I buy accessories or feed?',
    a: 'Browse the Accessories Store from the home screen, add items to your cart, and checkout — orders are placed directly with the seller.',
  },
  {
    q: 'How do I contact a horse seller?',
    a: 'Open a horse listing and send an inquiry — the seller will receive your message and contact details.',
  },
  {
    q: 'How do I track my order?',
    a: 'Go to the Orders tab to see the status of all your accessories store orders.',
  },
  {
    q: 'Is my payment information safe?',
    a: 'Ashwa India does not store card details. All transactions are coordinated directly between buyers and sellers.',
  },
];

export function HelpSupportScreen() {
  const navigation = useNavigation<Nav>();
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  return (
    <Screen style={styles.noPadding}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft color={colors.foreground} size={20} />
        </Pressable>
        <Text style={styles.title}>Help & Support</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.contactRow}>
          <Pressable style={styles.contactCard} onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}>
            <View style={styles.contactIconWrap}>
              <Phone color={colors.primary} size={18} />
            </View>
            <Text style={styles.contactLabel}>Call Us</Text>
          </Pressable>
          <Pressable style={styles.contactCard} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
            <View style={styles.contactIconWrap}>
              <Mail color={colors.primary} size={18} />
            </View>
            <Text style={styles.contactLabel}>Email Us</Text>
          </Pressable>
          <Pressable style={styles.contactCard} onPress={() => Linking.openURL(`https://wa.me/${SUPPORT_PHONE.replace('+', '')}`)}>
            <View style={styles.contactIconWrap}>
              <MessageCircle color={colors.primary} size={18} />
            </View>
            <Text style={styles.contactLabel}>WhatsApp</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqCard}>
          {faqs.map((item, index) => {
            const open = openIndex === index;
            return (
              <View key={item.q} style={[styles.faqRow, index === faqs.length - 1 && styles.faqRowLast]}>
                <Pressable
                  style={styles.faqHeader}
                  onPress={() => setOpenIndex(open ? null : index)}>
                  <Text style={styles.faqQuestion}>{item.q}</Text>
                  <ChevronDown
                    color={colors.mutedForeground}
                    size={16}
                    style={open ? styles.chevronOpen : undefined}
                  />
                </Pressable>
                {open ? <Text style={styles.faqAnswer}>{item.a}</Text> : null}
              </View>
            );
          })}
        </View>
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
  contactRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  contactCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  contactIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.foreground,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  faqCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  faqRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  faqRowLast: {
    borderBottomWidth: 0,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 4,
    gap: spacing.sm,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  faqAnswer: {
    fontSize: 12,
    color: colors.mutedForeground,
    lineHeight: 18,
    paddingBottom: spacing.sm + 4,
  },
});
