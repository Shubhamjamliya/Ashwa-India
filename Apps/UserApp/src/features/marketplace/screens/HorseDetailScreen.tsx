import React, { useEffect, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import {
  ArrowLeft,
  Bookmark,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Dna,
  Heart,
  LayoutGrid,
  MapPin,
  Medal,
  MessageCircle,
  Palette,
  Phone,
  Play,
  Ruler,
  Share2,
  ShieldCheck,
  VenetianMask,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { LoadingView } from '../../../components/StateViews';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getMediaUrl } from '../../../services/media';
import { fetchBranding } from '../../../services/branding';
import { useWishlist } from '../../../context/WishlistContext';
import { VisitRequestForm } from '../../inquiries/components/VisitRequestForm';
import type { Inquiry } from '../../inquiries/types';
import type { Horse } from '../types';
import { priceLabel } from '../price';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'HorseDetail'>;
type Rt = RouteProp<HomeStackParamList, 'HorseDetail'>;

const SCOPE_LABEL: Record<string, string> = {
  riding: 'Riding',
  racing: 'Racing',
  breeding: 'Breeding',
  showing: 'Showing',
  pleasure: 'Pleasure',
  trekking: 'Trekking',
  therapy: 'Therapy',
  draught: 'Draught',
};

const VACCINATION_LABEL: Record<string, string> = {
  complete: 'Complete',
  partial: 'Partial',
  none: 'None',
  unknown: 'Not known',
};

const THUMB_LIMIT = 4;
const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

// One cell of the icon spec grid (type, age, height, breed, ...).
function Spec({ icon: Icon, label, value }: { icon: typeof Dna; label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.spec}>
      <Icon color={colors.navy} size={18} />
      <Text style={styles.specLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.specValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function HorseDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { isSaved, toggle } = useWishlist();
  const [horse, setHorse] = useState<Horse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enquiring, setEnquiring] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [visitSent, setVisitSent] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [brand, setBrand] = useState<{ companyName: string; logoUrl: string | null }>({
    companyName: 'Ashwa India',
    logoUrl: null,
  });

  useEffect(() => {
    fetchBranding().then(setBrand);
  }, []);

  useEffect(() => {
    apiFetch<{ horse: Horse }>(`/marketplace/horses/${params.horseId}`)
      .then(data => setHorse(data.horse))
      .catch(e => setError(e.message || 'Failed to load listing'))
      .finally(() => setLoading(false));
  }, [params.horseId]);

  // Opens the chat with the seller for this horse — reuses an existing conversation if there
  // is one, otherwise starts a new one first.
  const openChat = async () => {
    if (enquiring || !horse) return;
    setEnquiring(true);
    setError('');
    try {
      const mine = await apiFetch<{ inquiries: Inquiry[] }>('/marketplace/inquiries/mine');
      const existing = (mine.inquiries || []).find(inq => String(inq.horse?._id) === String(params.horseId));
      if (existing) {
        navigation.navigate('InquiryThread', { inquiryId: existing._id });
        return;
      }
      const data = await apiFetch<{ inquiry: Inquiry }>('/marketplace/inquiries', {
        method: 'POST',
        body: {
          horseId: params.horseId,
          message: `Hi, I'm interested in ${horse.name || horse.breed}. Could you share more details?`,
        },
      });
      navigation.navigate('InquiryThread', { inquiryId: data.inquiry._id });
    } catch (e: any) {
      setError(e.message || 'Could not start the conversation');
    } finally {
      setEnquiring(false);
    }
  };

  const share = () => {
    if (!horse) return;
    const where = horse.location ? ` in ${horse.location}` : '';
    Share.share({
      message: `${horse.name || horse.breed}${where} · ${priceLabel(horse)} — on ${brand.companyName}`,
    }).catch(() => {});
  };

  const backButton = (
    <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
      <ArrowLeft color={colors.white} size={20} />
    </Pressable>
  );

  if (loading || !horse) {
    return (
      <Screen style={styles.noPadding} topColor={colors.navy}>
        <View style={styles.plainHeader}>{backButton}</View>
        {loading ? <LoadingView /> : <Text style={styles.pageError}>{error || 'Listing not found'}</Text>}
      </Screen>
    );
  }

  const scope = (horse.scopeOfWork || []).map(s => SCOPE_LABEL[s] || cap(s));
  const photos = horse.photos || [];
  const videos = (horse.videos || []).filter(Boolean);
  const registration = [horse.registration?.registry, horse.registration?.number].filter(Boolean).join(' · ');
  const isLease = horse.listingType === 'lease';
  const shortId = horse._id ? horse._id.slice(-6).toUpperCase() : '';
  const saved = isSaved(horse._id);
  const vaccination = horse.health?.vaccinationStatus ? VACCINATION_LABEL[horse.health.vaccinationStatus] : '';

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <View style={styles.header}>
        {backButton}
        <View style={styles.brand}>
          {brand.logoUrl ? <Image source={{ uri: brand.logoUrl }} style={styles.logo} resizeMode="contain" /> : null}
          <View style={styles.brandText}>
            <Text style={styles.brandName} numberOfLines={1}>
              {brand.companyName.toUpperCase()}
            </Text>
            <Text style={styles.brandTagline} numberOfLines={1}>
              INDIA'S PREMIER EQUINE MARKETPLACE
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.headerAction}>
            <ShieldCheck color="rgba(255,255,255,0.8)" size={18} />
            <Text style={styles.headerActionText}>Verified</Text>
          </View>
          <Pressable style={styles.headerAction} onPress={() => toggle(horse)} hitSlop={6}>
            <Heart
              color={saved ? colors.primary : 'rgba(255,255,255,0.8)'}
              fill={saved ? colors.primary : 'transparent'}
              size={18}
            />
            <Text style={[styles.headerActionText, saved && styles.goldText]}>Favourite</Text>
          </Pressable>
          <Pressable style={styles.headerAction} onPress={share} hitSlop={6}>
            <Share2 color="rgba(255,255,255,0.8)" size={18} />
            <Text style={styles.headerActionText}>Share</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.gallery}>
          {photos[activeImg] ? (
            <Image source={{ uri: getMediaUrl(photos[activeImg]) }} style={styles.fill} />
          ) : (
            <View style={styles.noPhoto}>
              <Text style={styles.noPhotoText}>No photo available</Text>
            </View>
          )}

          {horse.status === 'listed' ? (
            <View style={[styles.galleryBadge, styles.badgeRight]}>
              <ShieldCheck color={colors.primary} size={12} />
              <Text style={styles.galleryBadgeText}>VERIFIED HORSE</Text>
            </View>
          ) : null}
          <View style={[styles.galleryBadge, styles.badgeLeft]}>
            <Text style={styles.galleryBadgeText}>{isLease ? 'FOR LEASE' : 'FOR SALE'}</Text>
          </View>

          {photos.length > 1 ? (
            <>
              <Pressable
                style={[styles.arrow, styles.arrowLeft]}
                onPress={() => setActiveImg(i => (i - 1 + photos.length) % photos.length)}>
                <ChevronLeft color={colors.white} size={20} />
              </Pressable>
              <Pressable style={[styles.arrow, styles.arrowRight]} onPress={() => setActiveImg(i => (i + 1) % photos.length)}>
                <ChevronRight color={colors.white} size={20} />
              </Pressable>
              <Text style={styles.counter}>
                {activeImg + 1} / {photos.length}
              </Text>
              <View style={styles.dots}>
                {photos.map((_, i) => (
                  <View key={i} style={[styles.dot, i === activeImg && styles.dotActive]} />
                ))}
              </View>
            </>
          ) : null}
        </View>

        {photos.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbStrip} contentContainerStyle={styles.thumbs}>
            {photos.slice(0, THUMB_LIMIT).map((url, i) => (
              <Pressable
                key={url + i}
                onPress={() => setActiveImg(i)}
                style={[styles.thumb, i === activeImg && styles.thumbActive]}>
                <Image source={{ uri: getMediaUrl(url) }} style={styles.fill} />
              </Pressable>
            ))}
            {photos.length > THUMB_LIMIT ? (
              <Pressable style={[styles.thumb, styles.viewAll]} onPress={() => setActiveImg(THUMB_LIMIT)}>
                <LayoutGrid color={colors.white} size={16} />
                <Text style={styles.viewAllText}>VIEW ALL</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        ) : null}

        <View style={styles.body}>
          <View style={styles.idRow}>
            <View>
              <Text style={styles.idLabel}>HORSE ID</Text>
              <Text style={styles.idValue}>{shortId ? `AI-${shortId}` : '—'}</Text>
            </View>
            {saved ? (
              <View style={styles.inline}>
                <Bookmark color={colors.primary} fill={colors.primary} size={14} />
                <Text style={styles.shortlisted}>Shortlisted</Text>
              </View>
            ) : null}
          </View>

          <View>
            <Text style={styles.title}>{horse.name || horse.breed}</Text>
            {horse.name ? <Text style={styles.subtitle}>{horse.breed}</Text> : null}
            {horse.location ? (
              <View style={[styles.inline, styles.mt4]}>
                <MapPin color={colors.mutedForeground} size={14} />
                <Text style={styles.location}>{horse.location}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.specGrid}>
            <Spec icon={VenetianMask} label="TYPE" value={cap(horse.gender)} />
            <Spec icon={CalendarClock} label="AGE" value={horse.age != null ? `${horse.age} Years` : ''} />
            <Spec icon={Ruler} label="HEIGHT" value={horse.height != null ? `${horse.height} inch` : ''} />
            <Spec icon={Dna} label="BREED" value={horse.breed} />
            <Spec icon={Palette} label="COLOR" value={horse.color} />
            <Spec icon={MapPin} label="LOCATION" value={horse.location} />
            <Spec icon={Medal} label="DISCIPLINE" value={horse.discipline} />
          </View>

          {scope.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Scope of Work</Text>
              <View style={styles.chips}>
                {scope.map(s => (
                  <View key={s} style={styles.scopeChip}>
                    <ShieldCheck color="#8A6414" size={14} />
                    <Text style={styles.scopeText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this horse</Text>
            <View style={styles.aboutRow}>
              {horse.description ? <Text style={styles.aboutText}>{horse.description}</Text> : <View style={styles.flex} />}
              <View style={styles.facts}>
                <View>
                  <Text style={styles.factLabel}>TRAINED</Text>
                  <Text style={styles.factValue} numberOfLines={1}>
                    {horse.trainingLevel === 'trained' ? 'Yes' : cap(horse.trainingLevel) || '—'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.factLabel}>VACCINATED</Text>
                  <Text style={styles.factValue} numberOfLines={1}>
                    {vaccination || '—'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <Section title="Health information">
            <Row label="Vaccination status" value={vaccination} />
            <Row label="Health notes" value={horse.health?.notes} />
          </Section>

          <Section title="Registration details">
            <Row label="Registry" value={registration} />
            {!registration ? <Text style={styles.muted}>Not registered or not provided.</Text> : null}
          </Section>

          {videos.length > 0 ? (
            <Section title="Videos">
              {videos.map((url, i) => (
                <Pressable key={url + i} style={styles.video} onPress={() => Linking.openURL(url)}>
                  <Play color={colors.primary} size={16} />
                  <Text style={styles.videoText} numberOfLines={1}>
                    Watch video {videos.length > 1 ? i + 1 : ''}
                  </Text>
                </Pressable>
              ))}
            </Section>
          ) : null}

          <Section title="Seller information">
            <Text style={styles.sellerName}>{horse.seller?.businessName || horse.seller?.name}</Text>
            {horse.seller?.phone ? (
              <View style={styles.inline}>
                <Phone color="#525252" size={14} />
                <Text style={styles.sellerPhone}>{horse.seller.phone}</Text>
              </View>
            ) : null}
          </Section>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.section}>
            <View style={styles.visitHead}>
              <Text style={styles.visitTitle}>Visit the horse</Text>
              {!visitSent ? (
                <Pressable style={styles.inline} onPress={() => setVisitOpen(v => !v)} hitSlop={8}>
                  <CalendarClock color={colors.primary} size={16} />
                  <Text style={styles.visitToggle}>{visitOpen ? 'Close' : 'Request visit'}</Text>
                </Pressable>
              ) : null}
            </View>
            {visitSent ? (
              <Text style={styles.visitSent}>
                Visit request sent. The seller will confirm soon. Track it under your conversations.
              </Text>
            ) : null}
            {visitOpen && !visitSent ? (
              <VisitRequestForm
                horseId={horse._id}
                onSent={() => {
                  setVisitSent(true);
                  setVisitOpen(false);
                }}
              />
            ) : null}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>PRICE</Text>
          <Text style={styles.price} numberOfLines={1}>
            {priceLabel(horse)}
          </Text>
          {!isLease && horse.priceNegotiable ? <Text style={styles.negotiable}>(Negotiable)</Text> : null}
        </View>
        <Pressable style={[styles.enquireBtn, enquiring && styles.disabled]} onPress={openChat} disabled={enquiring}>
          <MessageCircle color={colors.white} size={16} />
          <View style={styles.enquireTextWrap}>
            <Text style={styles.enquireText} numberOfLines={1}>
              {enquiring ? 'Opening...' : 'Enquire Now'}
            </Text>
            <Text style={styles.enquireSub} numberOfLines={1}>
              Get details from seller
            </Text>
          </View>
        </Pressable>
        {horse.seller?.phone ? (
          <Pressable style={styles.callBtn} onPress={() => Linking.openURL(`tel:${horse.seller.phone}`)}>
            <Phone color={colors.navy} size={16} />
            <Text style={styles.callText}>Call</Text>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1, minWidth: 0 },
  fill: { width: '100%', height: '100%' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mt4: { marginTop: 4 },
  plainHeader: { backgroundColor: colors.navy, padding: spacing.md },
  pageError: { padding: spacing.xl, textAlign: 'center', color: colors.destructive, fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.navy,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  brand: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  logo: { width: 28, height: 28 },
  brandText: { minWidth: 0, alignItems: 'center' },
  brandName: { fontSize: 15, fontWeight: '800', letterSpacing: 0.5, color: colors.primary },
  brandTagline: { fontSize: 7, fontWeight: '600', letterSpacing: 0.6, color: 'rgba(255,255,255,0.5)' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAction: { alignItems: 'center', gap: 2 },
  headerActionText: { fontSize: 8, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  goldText: { color: colors.primary },
  scroll: { paddingBottom: spacing.lg },
  gallery: { height: 280, width: '100%', backgroundColor: colors.muted, overflow: 'hidden' },
  noPhoto: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noPhotoText: { fontSize: 14, color: '#A3A3A3' },
  galleryBadge: {
    position: 'absolute',
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.full,
    backgroundColor: colors.navy,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeRight: { right: 12 },
  badgeLeft: { left: 12, backgroundColor: 'rgba(11,28,51,0.9)' },
  galleryBadgeText: { fontSize: 10, fontWeight: '700', color: colors.white },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLeft: { left: 8 },
  arrowRight: { right: 8 },
  counter: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
    overflow: 'hidden',
  },
  dots: { position: 'absolute', bottom: 14, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { width: 16, backgroundColor: colors.white },
  thumbStrip: { backgroundColor: colors.card },
  thumbs: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 12 },
  thumb: { width: 64, height: 64, borderRadius: radius.md, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  thumbActive: { borderColor: colors.primary },
  viewAll: { backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', gap: 4 },
  viewAllText: { fontSize: 8, fontWeight: '700', color: colors.white },
  body: { gap: spacing.md, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  idRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
  },
  idLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, color: '#A3A3A3' },
  idValue: { fontSize: 20, fontWeight: '800', letterSpacing: 0.4, color: colors.foreground },
  shortlisted: { fontSize: 12, fontWeight: '700', color: colors.primary },
  title: { fontSize: 20, fontWeight: '700', color: colors.foreground },
  subtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 2 },
  location: { fontSize: 13, color: colors.mutedForeground },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  spec: { width: '25%', paddingRight: 6, gap: 4 },
  specLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4, color: '#A3A3A3' },
  specValue: { fontSize: 13, fontWeight: '700', color: colors.foreground },
  section: {
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.mutedForeground,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  scopeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#E9D8AE',
    backgroundColor: '#FBF4E4',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  scopeText: { fontSize: 12, fontWeight: '600', color: '#8A6414' },
  aboutRow: { flexDirection: 'row', gap: 12 },
  aboutText: { flex: 1, minWidth: 0, fontSize: 13, lineHeight: 20, color: colors.foreground },
  facts: { width: 96, gap: spacing.sm, borderLeftWidth: 1, borderLeftColor: colors.border, paddingLeft: 12 },
  factLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4, color: '#A3A3A3' },
  factValue: { fontSize: 12, fontWeight: '600', color: colors.foreground },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 4 },
  rowLabel: { fontSize: 12.5, color: colors.mutedForeground },
  rowValue: { flexShrink: 1, fontSize: 12.5, fontWeight: '600', color: colors.foreground, textAlign: 'right' },
  muted: { fontSize: 12, color: colors.mutedForeground },
  video: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    padding: 12,
  },
  videoText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.foreground },
  sellerName: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  sellerPhone: { fontSize: 13, color: '#525252' },
  error: { fontSize: 13, color: colors.destructive },
  visitHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  visitTitle: { fontSize: 15, fontWeight: '700', color: colors.foreground },
  visitToggle: { fontSize: 12, fontWeight: '700', color: colors.primary },
  visitSent: { fontSize: 14, color: '#047857' },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  priceBox: { maxWidth: '38%' },
  priceLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4, color: '#A3A3A3' },
  price: { fontSize: 15, fontWeight: '800', color: colors.foreground },
  negotiable: { fontSize: 10, fontWeight: '600', color: '#059669' },
  enquireBtn: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
  },
  enquireTextWrap: { flexShrink: 1, minWidth: 0 },
  enquireText: { fontSize: 13, fontWeight: '700', color: colors.white },
  enquireSub: { fontSize: 9, fontWeight: '500', color: 'rgba(255,255,255,0.8)' },
  disabled: { opacity: 0.6 },
  callBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.navy,
    paddingHorizontal: 12,
  },
  callText: { fontSize: 8, fontWeight: '700', color: colors.navy },
});
