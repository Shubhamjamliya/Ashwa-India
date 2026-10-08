import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, Mail, MessageCircle, Phone } from 'lucide-react-native';
import { Screen } from '../../../components/Screen';
import { LightHeader } from '../../../components/LightHeader';
import { colors, radius, spacing } from '../../../theme/colors';

const SUPPORT_PHONE = '+911234567890';
const SUPPORT_EMAIL = 'support@ashwaindia.com';

const FAQS = [
  {
    q: 'How do I receive transport requests?',
    a: 'Once your account is approved, users who search for transport near you will send enquiries. They appear on the Home tab and ring you in real time.',
  },
  {
    q: 'How do I get paid?',
    a: 'Completed transport bookings are credited to your wallet. You can view balance and transactions from the Wallet tab.',
  },
  {
    q: 'How do I add money to my wallet?',
    a: 'Open the Wallet tab and tap Add Money. Payments are processed securely through Razorpay.',
  },
  {
    q: 'Why is my account still pending?',
    a: 'New transporter accounts are reviewed by the Ashwa India admin team before they can receive requests. This usually takes a short while.',
  },
];

export function HelpSupportScreen() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const contact = (Icon: typeof Phone, label: string, url: string) => (
    <Pressable style={styles.contact} onPress={() => Linking.openURL(url)}>
      <View style={styles.contactIcon}>
        <Icon color={colors.primary} size={18} />
      </View>
      <Text style={styles.contactLabel}>{label}</Text>
    </Pressable>
  );

  return (
    <Screen style={styles.noPadding}>
      <LightHeader title="Help & Support" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.contacts}>
          {contact(Phone, 'Call Us', `tel:${SUPPORT_PHONE}`)}
          {contact(Mail, 'Email Us', `mailto:${SUPPORT_EMAIL}`)}
          {contact(MessageCircle, 'WhatsApp', `https://wa.me/${SUPPORT_PHONE.replace('+', '')}`)}
        </View>

        <Text style={styles.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>
        <View style={styles.faqCard}>
          {FAQS.map((item, index) => {
            const open = openIndex === index;
            return (
              <View key={item.q} style={index < FAQS.length - 1 && styles.divider}>
                <Pressable style={styles.faqHead} onPress={() => setOpenIndex(open ? null : index)}>
                  <Text style={styles.question}>{item.q}</Text>
                  <ChevronDown color={colors.mutedForeground} size={16} style={open ? styles.rotated : undefined} />
                </Pressable>
                {open ? <Text style={styles.answer}>{item.a}</Text> : null}
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
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  contacts: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  contact: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingVertical: spacing.md,
  },
  contactIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontSize: 12, fontWeight: '600', color: colors.foreground },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, color: colors.mutedForeground, marginBottom: spacing.sm },
  faqCard: { overflow: 'hidden', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  faqHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 14 },
  question: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.foreground },
  rotated: { transform: [{ rotate: '180deg' }] },
  answer: { fontSize: 12, lineHeight: 18, color: colors.mutedForeground, paddingHorizontal: spacing.md, paddingBottom: 14 },
});
