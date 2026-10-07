import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Briefcase, CheckCircle2, Mail, MapPin, Phone, Stethoscope } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { ErrorView, LoadingView } from '../../../components/StateViews';
import { Stars } from '../../../components/Stars';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getMediaUrl } from '../../../services/media';
import { fmtDate } from '../../../utils/format';
import type { HomeStackParamList } from '../../../navigation/types';
import { UNIT_LABEL, type ProviderDetail, type ProviderReview } from '../types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'ProviderProfile'>;
type Rt = RouteProp<HomeStackParamList, 'ProviderProfile'>;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function ProviderProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { serviceKey, providerId } = params;
  const [data, setData] = useState<{ provider: ProviderDetail; reviews: ProviderReview[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ provider: ProviderDetail; reviews: ProviderReview[] }>(`/services/providers/${providerId}`)
      .then(setData)
      .catch(e => setError(e.message || 'Failed to load provider'))
      .finally(() => setLoading(false));
  }, [providerId]);

  const send = async () => {
    setSending(true);
    setSendError('');
    try {
      await apiFetch('/services/requests', {
        method: 'POST',
        body: { providerId, serviceType: serviceKey, message: message.trim() || undefined },
      });
      setSent(true);
      setOpen(false);
    } catch (e: any) {
      setSendError(e.message || 'Could not send the request');
    } finally {
      setSending(false);
    }
  };

  if (loading || error || !data) {
    return (
      <Screen style={styles.noPadding} topColor={colors.navy}>
        <NavyHeader title="Provider profile" back="solid" />
        {loading ? <LoadingView /> : <ErrorView message={error || 'Provider not found'} />}
      </Screen>
    );
  }

  const p = data.provider;
  const reviews = data.reviews || [];
  const offered = (p.pricing || []).filter(x => p.serviceTypes.includes(x.serviceKey));
  const thisPrice = offered.find(x => x.serviceKey === serviceKey);

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title="Provider profile" back="solid" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <View style={styles.heroRow}>
              <View style={styles.heroAvatar}>
                <Stethoscope color={colors.primary} size={28} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.heroName} numberOfLines={1}>
                  {p.businessName || 'Provider'}
                </Text>
                <View style={styles.heroRating}>
                  <Stars value={p.rating.average} />
                  <Text style={styles.heroMuted}>
                    {p.rating.count
                      ? `${p.rating.average.toFixed(1)} · ${p.rating.count} reviews`
                      : 'No reviews yet'}
                  </Text>
                </View>
                <View style={styles.heroRating}>
                  <Briefcase color={colors.navyMuted} size={14} />
                  <Text style={styles.heroMuted}>
                    {p.experienceYears} {p.experienceYears === 1 ? 'year' : 'years'} experience
                  </Text>
                </View>
              </View>
            </View>
            {p.description ? <Text style={styles.heroDesc}>{p.description}</Text> : null}
          </View>

          {p.serviceTypes?.length > 0 ? (
            <Section title="Services">
              <View style={styles.chips}>
                {p.serviceTypes.map(s => (
                  <Text key={s} style={styles.goldChip}>
                    {s}
                  </Text>
                ))}
              </View>
            </Section>
          ) : null}

          {p.gallery?.length ? (
            <Section title="Gallery">
              <View style={styles.gallery}>
                {p.gallery.map((url, i) => (
                  <Pressable key={url + i} style={styles.galleryItem} onPress={() => setPhoto(url)}>
                    <Image source={{ uri: getMediaUrl(url) }} style={styles.fill} />
                  </Pressable>
                ))}
              </View>
            </Section>
          ) : null}

          {offered.length > 0 ? (
            <Section title="Pricing">
              {offered.map((x, i) => (
                <View key={x.serviceKey} style={[styles.priceRow, i > 0 && styles.divider]}>
                  <View style={styles.flex}>
                    <Text style={styles.priceName}>{x.serviceKey}</Text>
                    {x.note ? <Text style={styles.muted}>{x.note}</Text> : null}
                  </View>
                  <Text style={styles.priceAmount}>
                    ₹{x.amount.toLocaleString('en-IN')} <Text style={styles.muted}>{UNIT_LABEL[x.unit]}</Text>
                  </Text>
                </View>
              ))}
            </Section>
          ) : null}

          {p.certifications ? (
            <Section title="Credentials">
              <Text style={styles.body}>{p.certifications}</Text>
            </Section>
          ) : null}

          {p.serviceZones?.length ? (
            <Section title="Service area">
              <View style={styles.chips}>
                {p.serviceZones.map(z => (
                  <View key={z.id} style={styles.blueChip}>
                    <MapPin color="#2563EB" size={12} />
                    <Text style={styles.blueChipText}>{z.name}</Text>
                  </View>
                ))}
              </View>
            </Section>
          ) : null}

          <Section title="Contact details">
            {p.location ? (
              <View style={styles.contactRow}>
                <MapPin color={colors.mutedForeground} size={16} />
                <Text style={styles.body}>{p.location}</Text>
              </View>
            ) : null}
            {p.phone ? (
              <Pressable style={styles.contactRow} onPress={() => Linking.openURL(`tel:${p.phone}`)}>
                <Phone color={colors.mutedForeground} size={16} />
                <Text style={[styles.body, styles.bold]}>{p.phone}</Text>
              </Pressable>
            ) : null}
            {p.email ? (
              <Pressable style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${p.email}`)}>
                <Mail color={colors.mutedForeground} size={16} />
                <Text style={styles.body}>{p.email}</Text>
              </Pressable>
            ) : null}
          </Section>

          <Section title={`Reviews & ratings${reviews.length ? ` (${reviews.length})` : ''}`}>
            {reviews.length === 0 ? (
              <Text style={styles.muted}>No reviews yet. Reviews appear after a completed service.</Text>
            ) : (
              reviews.map((r, i) => (
                <View key={r.id} style={[styles.review, i > 0 && styles.divider]}>
                  <View style={styles.reviewTop}>
                    <Text style={[styles.body, styles.bold]}>{r.userName}</Text>
                    <Stars value={r.rating} />
                  </View>
                  {r.comment ? <Text style={styles.reviewText}>{r.comment}</Text> : null}
                  <Text style={styles.reviewDate}>{fmtDate(r.createdAt)}</Text>
                </View>
              ))
            )}
          </Section>
        </ScrollView>

        <View style={styles.bottomBar}>
          {sent ? (
            <View style={styles.sentRow}>
              <View style={styles.contactRow}>
                <CheckCircle2 color={colors.success} size={16} />
                <Text style={styles.sentText}>Request sent</Text>
              </View>
              <Pressable onPress={() => navigation.navigate('Booking' as never)}>
                <Text style={styles.link}>View bookings</Text>
              </Pressable>
            </View>
          ) : open ? (
            <View style={styles.gap}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                multiline
                placeholder="Describe what you need (optional)"
                placeholderTextColor={colors.mutedForeground}
                style={styles.textarea}
              />
              {sendError ? <Text style={styles.error}>{sendError}</Text> : null}
              <View style={styles.btnRow}>
                <Pressable style={[styles.btn, styles.btnMuted]} onPress={() => setOpen(false)}>
                  <Text style={styles.btnMutedText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, styles.btnGold, sending && styles.disabled]}
                  disabled={sending}
                  onPress={send}>
                  <Text style={styles.btnGoldText}>{sending ? 'Sending...' : 'Send request'}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={[styles.btn, styles.btnGold]} onPress={() => setOpen(true)}>
              <Text style={styles.btnGoldText}>
                Book this provider
                {thisPrice ? ` · ₹${thisPrice.amount.toLocaleString('en-IN')} ${UNIT_LABEL[thisPrice.unit]}` : ''}
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      <Modal visible={photo != null} transparent animationType="fade" onRequestClose={() => setPhoto(null)}>
        <Pressable style={styles.lightbox} onPress={() => setPhoto(null)}>
          {photo ? (
            <Image source={{ uri: getMediaUrl(photo) }} style={styles.lightboxImg} resizeMode="contain" />
          ) : null}
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1 },
  fill: { width: '100%', height: '100%' },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  hero: { backgroundColor: colors.navy, borderRadius: radius.lg, padding: spacing.md },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroAvatar: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: { fontSize: 18, fontWeight: '700', color: colors.white },
  heroRating: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  heroMuted: { fontSize: 12, color: colors.navyMuted },
  heroDesc: { fontSize: 13, lineHeight: 20, color: '#E7EDF5', marginTop: 12 },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  goldChip: {
    backgroundColor: colors.accent,
    color: colors.accentForeground,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    textTransform: 'capitalize',
    overflow: 'hidden',
  },
  blueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E1ECFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  blueChipText: { fontSize: 11, fontWeight: '700', color: '#2563EB' },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  galleryItem: {
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.muted,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 8 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  priceName: { fontSize: 13, fontWeight: '700', color: colors.foreground, textTransform: 'capitalize' },
  priceAmount: { fontSize: 14, fontWeight: '800', color: colors.primary },
  body: { fontSize: 13, color: colors.foreground },
  bold: { fontWeight: '700' },
  muted: { fontSize: 11, color: colors.mutedForeground, fontWeight: '500' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  review: { paddingVertical: 8 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewText: { fontSize: 12, color: '#525252', marginTop: 4 },
  reviewDate: { fontSize: 10, color: '#A3A3A3', marginTop: 4 },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  sentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sentText: { fontSize: 14, fontWeight: '700', color: colors.success },
  link: { fontSize: 12, fontWeight: '700', color: colors.primary },
  gap: { gap: spacing.sm },
  textarea: {
    minHeight: 60,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.foreground,
    textAlignVertical: 'top',
  },
  error: { fontSize: 12, color: colors.destructive },
  btnRow: { flexDirection: 'row', gap: spacing.sm },
  btn: { flex: 1, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  btnMuted: { backgroundColor: colors.muted },
  btnMutedText: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  btnGold: { backgroundColor: colors.primary },
  btnGoldText: { fontSize: 14, fontWeight: '700', color: colors.white },
  disabled: { opacity: 0.5 },
  lightbox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  lightboxImg: { width: '100%', height: '80%', borderRadius: radius.md },
});
