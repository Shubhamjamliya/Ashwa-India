import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell, ChevronDown, ChevronRight, Heart, MapPin, Search, ShoppingCart, Users } from 'lucide-react-native';
import { colors, radius, spacing } from '../../../theme/colors';
import { useLocationContext } from '../../../context/LocationContext';

const HERO_IMAGE = require('../../../assets/heroimage.png');

type Props = {
  horsesCount: number;
  cartCount?: number;
  wishlistCount?: number;
  notificationCount?: number;
  onBrowsePress: () => void;
  onCartPress?: () => void;
  onBellPress?: () => void;
  onWishlistPress?: () => void;
  onChangeLocationPress: () => void;
};

export function HeroSection({
  horsesCount,
  cartCount = 0,
  wishlistCount = 0,
  notificationCount = 0,
  onBrowsePress,
  onCartPress,
  onBellPress,
  onWishlistPress,
  onChangeLocationPress,
}: Props) {
  const { status, location } = useLocationContext();
  const locationLabel = status === 'loading' ? 'Locating...' : location?.label || 'Set Location';

  return (
    <View style={styles.wrapper}>
      <Image source={HERO_IMAGE} style={styles.heroImage} resizeMode="contain" />

      <View style={styles.topRow}>
        <View style={styles.headerLeft}>
          <View style={styles.brandRow}>
            <Text style={styles.logoGlyph}>🐎</Text>
            <Pressable style={styles.locationRow} onPress={onChangeLocationPress} hitSlop={6}>
              <MapPin color={colors.primary} size={13} />
              <Text style={styles.locationText} numberOfLines={1}>
                {locationLabel}
              </Text>
              <ChevronDown color={colors.navyMuted} size={13} />
            </Pressable>
          </View>
          <Text style={styles.brand}>
            Ashwa<Text style={styles.brandAccent}>India</Text>
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.iconBtn} onPress={onWishlistPress} hitSlop={8}>
            <Heart color={colors.navyForeground} size={18} />
            {wishlistCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{wishlistCount > 9 ? '9+' : wishlistCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={onCartPress} hitSlop={8}>
            <ShoppingCart color={colors.navyForeground} size={18} />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={onBellPress} hitSlop={8}>
            <Bell color={colors.navyForeground} size={18} />
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.textConstrained}>
        <Text style={styles.welcome}>WELCOME TO ASHWAINDIA</Text>
        <Text style={styles.heading}>
          India's <Text style={styles.headingAccent}>Horse</Text> Network
        </Text>
        <Text style={styles.subtitle}>
          Buy, sell, connect and grow with India's most trusted equine community.
        </Text>
      </View>

      <Pressable style={styles.cta} onPress={onBrowsePress}>
        <Search color={colors.navy} size={16} />
        <Text style={styles.ctaText}>Browse Horses</Text>
        <ChevronRight color={colors.navy} size={18} />
      </Pressable>

      {horsesCount > 0 && (
        <View style={styles.statRow}>
          <Users color={colors.navyMuted} size={13} />
          <Text style={styles.statText}>{horsesCount}+ horses listed on Ashwa India</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    overflow: 'hidden',
  },
  heroImage: {
    position: 'absolute',
    // Cancels the wrapper's paddingHorizontal exactly, so the image sits
    // flush against the screen's right edge instead of leaving a gap.
    right: -spacing.md,
    bottom: 0,
    width: 168,
    height: 210,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  logoGlyph: {
    fontSize: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyForeground,
    flexShrink: 1,
  },
  brand: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.navyForeground,
  },
  brandAccent: {
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navyLight,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: radius.full,
    backgroundColor: colors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.navy,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.white,
  },
  textConstrained: {
    maxWidth: '62%',
  },
  welcome: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.navyForeground,
    lineHeight: 34,
  },
  headingAccent: {
    color: colors.primary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.navyMuted,
    marginTop: spacing.sm,
    lineHeight: 19,
  },
  cta: {
    marginTop: spacing.md,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navy,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  statText: {
    fontSize: 12,
    color: colors.navyMuted,
  },
});
