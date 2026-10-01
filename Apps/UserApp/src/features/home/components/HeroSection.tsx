import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell, Heart, ShoppingCart } from 'lucide-react-native';
import { colors, radius, spacing } from '../../../theme/colors';
import { getMediaUrl } from '../../../services/media';

type Props = {
  heroImage?: string;
  horsesCount: number;
  cartCount?: number;
  wishlistCount?: number;
  notificationCount?: number;
  onBrowsePress: () => void;
  onCartPress?: () => void;
  onBellPress?: () => void;
  onWishlistPress?: () => void;
};

export function HeroSection({
  heroImage,
  horsesCount,
  cartCount = 0,
  wishlistCount = 0,
  notificationCount = 0,
  onBrowsePress,
  onCartPress,
  onBellPress,
  onWishlistPress,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.brand}>
            Ashwa<Text style={styles.brandAccent}>India</Text>
          </Text>
          <Text style={styles.tagline}>India's Horse Network</Text>
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

      <Text style={styles.welcome}>WELCOME TO ASHWAINDIA</Text>
      <Text style={styles.heading}>
        India's <Text style={styles.headingAccent}>Horse</Text> Network
      </Text>
      <Text style={styles.subtitle}>
        Buy, sell, connect and grow with India's most trusted equine community.
      </Text>

      {heroImage ? (
        <Image source={{ uri: getMediaUrl(heroImage) }} style={styles.heroImage} resizeMode="cover" />
      ) : null}

      <Pressable style={styles.cta} onPress={onBrowsePress}>
        <Text style={styles.ctaText}>Browse Horses</Text>
      </Pressable>

      {horsesCount > 0 && (
        <Text style={styles.statText}>{horsesCount}+ horses listed on Ashwa India</Text>
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
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  brand: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navyForeground,
  },
  brandAccent: {
    color: colors.primary,
  },
  tagline: {
    fontSize: 10,
    color: colors.navyMuted,
    marginTop: 2,
    letterSpacing: 0.3,
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
  heroImage: {
    width: '100%',
    height: 170,
    borderRadius: radius.lg,
    marginTop: spacing.md,
    backgroundColor: colors.navyLight,
  },
  cta: {
    marginTop: spacing.md,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  statText: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.navyMuted,
    textAlign: 'center',
  },
});
