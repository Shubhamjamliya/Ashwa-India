import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../theme/colors';

// Light header used by the web's profile, edit profile, settings, help and about pages:
// a white round back button and a dark title. `bar` adds the white strip with a bottom border
// and centres the title (profile page).
export function LightHeader({
  title,
  bar = false,
  titleSize = 18,
}: {
  title: string;
  bar?: boolean;
  titleSize?: number;
}) {
  const navigation = useNavigation();
  return (
    <View style={[styles.header, bar && styles.bar]}>
      <Pressable
        onPress={() => navigation.canGoBack() && navigation.goBack()}
        hitSlop={12}
        style={styles.backBtn}>
        <ArrowLeft color={colors.foreground} size={20} />
      </Pressable>
      <Text style={[styles.title, { fontSize: titleSize }, bar && styles.titleCentered]} numberOfLines={1}>
        {title}
      </Text>
      {bar ? <View style={styles.spacer} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  bar: {
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
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
  title: { flexShrink: 1, fontWeight: '700', color: colors.foreground },
  titleCentered: { flex: 1, textAlign: 'center' },
  spacer: { width: 36, height: 36 },
});
