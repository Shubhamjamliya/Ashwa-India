import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, Home, MessageSquare, Package, User } from 'lucide-react-native';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, radius, spacing } from '../theme/colors';

const icons: Record<string, typeof Home> = {
  Home: Home,
  Booking: Calendar,
  Orders: Package,
  Enquiry: MessageSquare,
  Profile: User,
};

// Pages with their own bottom bar or a full-height chat hide the tab bar, as on the web.
const HIDE_ON = new Set(['HorseDetail', 'InquiryThread']);

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const focusedPage = getFocusedRouteNameFromRoute(state.routes[state.index]);
  if (focusedPage && HIDE_ON.has(focusedPage)) return null;

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const Icon = icons[route.name] ?? Home;
          const label =
            options.tabBarLabel !== undefined
              ? String(options.tabBarLabel)
              : options.title !== undefined
              ? options.title
              : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tab} hitSlop={6}>
              <View style={styles.iconWrap}>
                <Icon color={isFocused ? colors.primary : colors.navyMuted} size={22} strokeWidth={isFocused ? 2.4 : 2} />
              </View>
              <Text style={[styles.label, isFocused && styles.labelActive]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.navyLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  iconWrap: {
    width: 40,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.navyMuted,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
