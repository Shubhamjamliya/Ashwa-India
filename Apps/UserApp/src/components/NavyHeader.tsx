import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../theme/colors';

// The web panel uses three back-button looks on its navy headers:
//   outline – thin white ring (PageHeader and most older pages)
//   solid   – filled navy-light circle (BackButton variant="dark")
//   glass   – faint white circle (jobs pages)
type BackStyle = 'outline' | 'solid' | 'glass' | 'none';

// Dark brand header used by inner pages: back button, title, optional subtitle and right slot.
// Pair it with <Screen topColor={colors.navy}> so the status bar area matches.
export function NavyHeader({
  title,
  subtitle,
  right,
  onBack,
  back = 'outline',
  backIcon = 'arrow',
  large = false,
  titleSize,
  centerTitle = false,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
  back?: BackStyle;
  backIcon?: 'arrow' | 'close';
  // Taller header with an 18px title (wallet and jobs pages).
  large?: boolean;
  titleSize?: number;
  centerTitle?: boolean;
}) {
  const navigation = useNavigation();
  // At a tab's first page this falls back to the Home tab, like the web's back button
  // returning to /user when there is no history.
  const handleBack = onBack || (() => navigation.canGoBack() && navigation.goBack());
  const Icon = backIcon === 'close' ? X : ArrowLeft;

  return (
    <View style={[styles.header, large && styles.headerLarge]}>
      {back !== 'none' ? (
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={[styles.backBtn, back === 'outline' && styles.outline, back === 'solid' && styles.solid, back === 'glass' && styles.glass]}>
          <Icon color={colors.white} size={20} />
        </Pressable>
      ) : null}
      <View style={[styles.titleWrap, centerTitle && styles.titleCentered]}>
        <Text
          style={[styles.title, large && styles.titleLarge, titleSize ? { fontSize: titleSize } : null]}
          numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? (centerTitle && back !== 'none' ? <View style={styles.backBtn} /> : null)}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  headerLarge: {
    paddingVertical: spacing.md,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  solid: {
    backgroundColor: colors.navyLight,
  },
  glass: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  titleCentered: {
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
  titleLarge: {
    fontSize: 18,
  },
  subtitle: {
    fontSize: 12,
    color: colors.navyMuted,
    marginTop: 1,
  },
});
