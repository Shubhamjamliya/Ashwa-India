import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { colors, radius, spacing } from '../theme/colors';

type Props = {
  placeholder?: string;
  onPress?: () => void;
};

export function SearchBarBox({ placeholder = 'Search horses, services, products...', onPress }: Props) {
  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.bar} onPress={onPress}>
        <Search color={colors.mutedForeground} size={18} />
        <Text style={styles.placeholder} numberOfLines={1}>
          {placeholder}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    paddingTop: 2,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 44,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeholder: {
    flex: 1,
    fontSize: 14,
    color: colors.mutedForeground,
  },
});
