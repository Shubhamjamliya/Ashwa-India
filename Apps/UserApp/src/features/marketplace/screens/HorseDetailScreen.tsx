import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowLeft, Heart, MapPin, Phone } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getMediaUrl } from '../../../services/media';
import { useWishlist } from '../../../context/WishlistContext';
import type { Horse } from '../types';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'HorseDetail'>;
type Rt = RouteProp<HomeStackParamList, 'HorseDetail'>;

export function HorseDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const [horse, setHorse] = useState<Horse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const { isSaved, toggle } = useWishlist();

  useEffect(() => {
    apiFetch<{ horse: Horse }>(`/marketplace/horses/${params.horseId}`)
      .then(data => setHorse(data.horse))
      .catch(e => setError(e.message || 'Failed to load listing'))
      .finally(() => setLoading(false));
  }, [params.horseId]);

  const sendInquiry = async () => {
    if (!message.trim()) return;
    setSending(true);
    setSendError(null);
    try {
      await apiFetch('/marketplace/inquiries', {
        method: 'POST',
        body: { horseId: params.horseId, message: message.trim() },
      });
      setSent(true);
      setMessage('');
    } catch (e: any) {
      setSendError(e.message || 'Failed to send inquiry');
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft color={colors.foreground} size={20} />
        </Pressable>
        <Text style={styles.title}>Horse Details</Text>
        {horse && (
          <Pressable
            style={styles.wishlistBtn}
            hitSlop={12}
            onPress={() => toggle(horse)}>
            <Heart
              color={colors.primary}
              size={18}
              fill={isSaved(horse._id) ? colors.primary : 'transparent'}
            />
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error || !horse ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || 'Listing not found'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {horse.photos?.[0] ? (
            <Image source={{ uri: getMediaUrl(horse.photos[0]) }} style={styles.hero} />
          ) : (
            <View style={[styles.hero, styles.heroPlaceholder]} />
          )}

          <Text style={styles.breed}>{horse.breed}</Text>
          <Text style={styles.price}>₹{horse.price.toLocaleString('en-IN')}</Text>

          <View style={styles.infoGrid}>
            {horse.age != null && <InfoChip label="Age" value={`${horse.age} yrs`} />}
            {horse.gender && <InfoChip label="Gender" value={horse.gender} />}
            {horse.color && <InfoChip label="Color" value={horse.color} />}
            {horse.height != null && <InfoChip label="Height" value={`${horse.height} hh`} />}
          </View>

          {horse.location ? (
            <View style={styles.locationRow}>
              <MapPin color={colors.mutedForeground} size={14} />
              <Text style={styles.locationText}>{horse.location}</Text>
            </View>
          ) : null}

          {horse.description ? (
            <Text style={styles.description}>{horse.description}</Text>
          ) : null}

          <View style={styles.sellerCard}>
            <Text style={styles.sellerLabel}>Seller</Text>
            <Text style={styles.sellerName}>
              {horse.seller?.businessName || horse.seller?.name}
            </Text>
            <View style={styles.locationRow}>
              <Phone color={colors.mutedForeground} size={14} />
              <Text style={styles.locationText}>{horse.seller?.phone}</Text>
            </View>
          </View>

          <View style={styles.inquiryCard}>
            <Text style={styles.inquiryTitle}>Interested in this horse?</Text>
            {sent ? (
              <Text style={styles.sentText}>
                Your inquiry has been sent to the seller.
              </Text>
            ) : (
              <>
                <Input
                  placeholder="Write a message to the seller..."
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={3}
                  style={styles.messageInput}
                />
                {sendError ? <Text style={styles.errorText}>{sendError}</Text> : null}
                <Button
                  title="Send Inquiry"
                  onPress={sendInquiry}
                  loading={sending}
                  disabled={!message.trim()}
                />
              </>
            )}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  wishlistBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 14,
  },
  content: {
    padding: spacing.md,
    paddingTop: 0,
    paddingBottom: spacing.xl,
  },
  hero: {
    width: '100%',
    height: 220,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  heroPlaceholder: {
    backgroundColor: colors.muted,
  },
  breed: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.foreground,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chipLabel: {
    fontSize: 10,
    color: colors.secondaryForeground,
    opacity: 0.7,
  },
  chipValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryForeground,
    textTransform: 'capitalize',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  locationText: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  description: {
    fontSize: 14,
    color: colors.foreground,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  sellerCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sellerLabel: {
    fontSize: 11,
    color: colors.mutedForeground,
    textTransform: 'uppercase',
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
    marginTop: 2,
  },
  inquiryCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  inquiryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
  },
  messageInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  sentText: {
    fontSize: 14,
    color: colors.success,
  },
});
