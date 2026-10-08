import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../theme/colors';

// The web transporter pages use a navy header with a filled navy-light back button (most pages),
// or a faint white one (jobs pages).
type BackStyle = 'solid' | 'glass' | 'none';

// Dark brand header: back button, title, optional subtitle and right slot.
// Pair it with <Screen topColor={colors.navy}> so the status bar area matches.
export function NavyHeader({
  title,
  subtitle,
  right,
  onBack,
  back = 'solid',
  titleSize = 18,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
  back?: BackStyle;
  titleSize?: number;
}) {
  const navigation = useNavigation();
  // At a tab's first page this falls back to the Home tab, like the web's back button
  // returning to /transporter when there is no history.
  const handleBack = onBack || (() => navigation.canGoBack() && navigation.goBack());

  return (
    <View style={styles.header}>
      {back !== 'none' ? (
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={[styles.backBtn, back === 'solid' ? styles.solid : styles.glass]}>
          <ArrowLeft color={colors.white} size={20} />
        </Pressable>
      ) : null}
      <View style={styles.titleWrap}>
        <Text style={[styles.title, { fontSize: titleSize }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solid: { backgroundColor: colors.navyLight },
  glass: { backgroundColor: 'rgba(255,255,255,0.1)' },
  titleWrap: { flex: 1, minWidth: 0 },
  title: { fontWeight: '700', color: colors.white },
  subtitle: { fontSize: 12, color: colors.navyMuted, marginTop: 2 },
});
