import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ArrowLeft,
  ChevronRight,
  Heart,
  Info,
  LifeBuoy,
  LogOut,
  MapPin,
  Package,
  Settings as SettingsIcon,
  User as UserIcon,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Screen } from '../../../components/Screen';
import { colors, radius, spacing } from '../../../theme/colors';
import { useAuth } from '../../../context/AuthContext';
import { useWishlist } from '../../../context/WishlistContext';
import type { HomeStackParamList, MainTabParamList } from '../../../navigation/types';

type Nav = BottomTabNavigationProp<MainTabParamList>;

type MenuItem = {
  key: string;
  label: string;
  sublabel?: string;
  icon: typeof Heart;
  onPress: () => void;
};

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const { horses: savedHorses } = useWishlist();
  const navigation = useNavigation<Nav>();

  const openHomeStackScreen = (screen: keyof HomeStackParamList) =>
    navigation.navigate('Home', { screen, params: undefined } as any);

  const accountItems: MenuItem[] = [
    {
      key: 'addresses',
      label: 'Saved Addresses',
      sublabel: 'Manage your delivery addresses',
      icon: MapPin,
      onPress: () => openHomeStackScreen('SavedAddresses'),
    },
    {
      key: 'orders',
      label: 'Your Orders',
      sublabel: 'Track accessories store orders',
      icon: Package,
      onPress: () => navigation.navigate('Orders'),
    },
    {
      key: 'saved-horses',
      label: 'Saved Horses',
      sublabel: savedHorses.length
        ? `${savedHorses.length} horse${savedHorses.length > 1 ? 's' : ''} shortlisted`
        : 'Horses you have shortlisted',
      icon: Heart,
      onPress: () => openHomeStackScreen('Wishlist'),
    },
  ];

  const moreItems: MenuItem[] = [
    {
      key: 'support',
      label: 'Help & Support',
      icon: LifeBuoy,
      onPress: () => openHomeStackScreen('HelpSupport'),
    },
    {
      key: 'about',
      label: 'About Ashwa India',
      icon: Info,
      onPress: () => openHomeStackScreen('About'),
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: SettingsIcon,
      onPress: () => openHomeStackScreen('Settings'),
    },
  ];

  const handleLogout = () => {
    Alert.alert('Log out?', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <Screen style={styles.noPadding}>
      <View style={styles.topBar}>
        <Pressable
          style={styles.backBtn}
          hitSlop={8}
          onPress={() => navigation.canGoBack() && navigation.goBack()}>
          <ArrowLeft color={colors.foreground} size={20} />
        </Pressable>
        <Text style={styles.topBarTitle}>Profile</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <UserIcon color={colors.primary} size={26} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.name}>{user?.name || 'User'}</Text>
            <Text style={styles.phone}>{user?.phone}</Text>
          </View>
        </View>

        <MenuSection title="Account" items={accountItems} />
        <MenuSection title="More" items={moreItems} />

        <Pressable style={styles.logoutRow} onPress={handleLogout}>
          <View style={[styles.iconWrap, styles.logoutIconWrap]}>
            <LogOut color={colors.destructive} size={18} />
          </View>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function MenuSection({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>
        {items.map((item, index) => (
          <Pressable
            key={item.key}
            style={[styles.row, index === items.length - 1 && styles.rowLast]}
            onPress={item.onPress}>
            <View style={styles.iconWrap}>
              <item.icon color={colors.primary} size={19} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              {item.sublabel ? <Text style={styles.rowSublabel}>{item.sublabel}</Text> : null}
            </View>
            <ChevronRight color={colors.mutedForeground} size={18} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  noPadding: {
    padding: 0,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  phone: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  section: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  rowSublabel: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  logoutIconWrap: {
    backgroundColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.destructive,
  },
});
