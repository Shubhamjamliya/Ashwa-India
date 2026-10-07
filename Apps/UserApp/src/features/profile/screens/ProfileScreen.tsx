import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ChevronRight,
  Heart,
  Info,
  LifeBuoy,
  LogOut,
  MapPin,
  MessageSquare,
  Package,
  Pencil,
  Settings as SettingsIcon,
  User as UserIcon,
  Wallet,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { colors, radius, spacing } from '../../../theme/colors';
import { useAuth } from '../../../context/AuthContext';
import { useWishlist } from '../../../context/WishlistContext';
import type { AppNavigation } from '../../../navigation/types';

type MenuItem = {
  key: string;
  label: string;
  sublabel?: string;
  icon: typeof Heart;
  iconBg: string;
  iconColor: string;
  onPress: () => void;
};

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const { horses: savedHorses } = useWishlist();
  const navigation = useNavigation<AppNavigation>();

  const accountItems: MenuItem[] = [
    {
      key: 'addresses',
      label: 'Saved Addresses',
      sublabel: 'Manage your delivery addresses',
      icon: MapPin,
      iconBg: '#E1ECFC',
      iconColor: '#2563EB',
      onPress: () => navigation.navigate('SavedAddresses'),
    },
    {
      key: 'wallet',
      label: 'Wallet',
      sublabel: 'Balance, add money and payments',
      icon: Wallet,
      iconBg: '#FBEFD6',
      iconColor: colors.primary,
      onPress: () => navigation.navigate('Wallet'),
    },
    {
      key: 'enquiries',
      label: 'Horse enquiries',
      sublabel: 'Conversations with sellers and visit requests',
      icon: MessageSquare,
      iconBg: '#E0F4E7',
      iconColor: '#16A34A',
      onPress: () => navigation.navigate('Enquiry'),
    },
    {
      key: 'orders',
      label: 'Your Orders',
      sublabel: 'Track accessories store orders',
      icon: Package,
      iconBg: '#F0E4FB',
      iconColor: '#7C3AED',
      onPress: () => navigation.navigate('Orders'),
    },
    {
      key: 'saved-horses',
      label: 'Saved Horses',
      sublabel: savedHorses.length
        ? `${savedHorses.length} horse${savedHorses.length > 1 ? 's' : ''} shortlisted`
        : 'Horses you have shortlisted',
      icon: Heart,
      iconBg: '#FBEFD6',
      iconColor: colors.primary,
      onPress: () => navigation.navigate('Wishlist'),
    },
  ];

  const moreItems: MenuItem[] = [
    {
      key: 'support',
      label: 'Help & Support',
      icon: LifeBuoy,
      iconBg: '#E0F4E7',
      iconColor: '#16A34A',
      onPress: () => navigation.navigate('HelpSupport'),
    },
    {
      key: 'about',
      label: 'About Ashwa India',
      icon: Info,
      iconBg: '#E1ECFC',
      iconColor: '#2563EB',
      onPress: () => navigation.navigate('About'),
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: SettingsIcon,
      iconBg: colors.muted,
      iconColor: colors.mutedForeground,
      onPress: () => navigation.navigate('Settings'),
    },
  ];

  const handleLogout = () => {
    Alert.alert('Log out?', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title="Profile" back="solid" titleSize={16} centerTitle />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <UserIcon color={colors.primary} size={26} />
            </View>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.name}>{user?.name || 'User'}</Text>
            <Text style={styles.phone}>{user?.phone}</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.editProfileBtn, pressed && styles.editProfileBtnPressed]}
          onPress={() => navigation.navigate('EditProfile')}>
          <Pencil color={colors.primary} size={15} />
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </Pressable>

        <MenuSection title="Account" items={accountItems} />
        <MenuSection title="More" items={moreItems} />

        <Pressable style={({ pressed }) => [styles.logoutRow, pressed && styles.rowPressed]} onPress={handleLogout}>
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
            style={({ pressed }) => [
              styles.row,
              index === items.length - 1 && styles.rowLast,
              pressed && styles.rowPressed,
            ]}
            onPress={item.onPress}>
            <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
              <item.icon color={item.iconColor} size={19} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              {item.sublabel ? <Text style={styles.rowSublabel}>{item.sublabel}</Text> : null}
            </View>
            <View style={styles.chevronWrap}>
              <ChevronRight color={colors.mutedForeground} size={16} />
            </View>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: radius.full,
    backgroundColor: colors.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navyForeground,
  },
  phone: {
    fontSize: 13,
    color: colors.navyMuted,
    marginTop: 2,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
  },
  editProfileBtnPressed: {
    backgroundColor: colors.accent,
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  section: {
    marginTop: spacing.lg,
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
    shadowColor: '#0F2238',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
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
  rowPressed: {
    backgroundColor: colors.muted,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  rowSublabel: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  chevronWrap: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
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
