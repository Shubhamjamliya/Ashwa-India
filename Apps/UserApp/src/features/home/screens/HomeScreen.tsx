import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Heart, Truck, Stethoscope, ShoppingBag } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { colors, radius, spacing } from '../../../theme/colors';
import { useAuth } from '../../../context/AuthContext';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

const quickLinks = [
  { key: 'providers', label: 'Service Providers', icon: Stethoscope, route: null },
  { key: 'transport', label: 'Horse Transport', icon: Truck, route: null },
  { key: 'horses', label: 'Horse Marketplace', icon: Heart, route: 'HorseMarketplace' as const },
  { key: 'store', label: 'Accessories Store', icon: ShoppingBag, route: null },
];

export function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hi, {user?.name || 'there'} 👋</Text>
          <Text style={styles.subtitle}>What would you like to do today?</Text>
        </View>

        <View style={styles.grid}>
          {quickLinks.map(({ key, label, icon: Icon, route }) => (
            <Pressable
              key={key}
              style={styles.card}
              disabled={!route}
              onPress={() => route && navigation.navigate(route)}>
              <View style={styles.cardIcon}>
                <Icon color={colors.primary} size={22} />
              </View>
              <Text style={styles.cardLabel}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No active bookings</Text>
          <Text style={styles.emptyText}>
            Browse services, transport or the marketplace to get started.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.foreground,
  },
  subtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  emptyState: {
    marginTop: spacing.xl,
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 4,
    textAlign: 'center',
  },
});
