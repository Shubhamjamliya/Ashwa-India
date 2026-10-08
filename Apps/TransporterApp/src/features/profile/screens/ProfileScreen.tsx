import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Banknote,
  Bell,
  Briefcase,
  Calendar,
  ChevronRight,
  Info,
  LifeBuoy,
  LogOut,
  Pencil,
  Percent,
  Settings as SettingsIcon,
  ShieldCheck,
  Star,
  Truck,
  UserRound,
  Wallet,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { LightHeader } from '../../../components/LightHeader';
import { colors, radius, spacing } from '../../../theme/colors';
import { useAuth } from '../../../context/AuthContext';
import type { AppNavigation } from '../../../navigation/types';

const STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: 'Pending Approval', bg: '#FEF3C7', fg: '#B45309' },
  approved: { label: 'Approved', bg: '#D1FAE5', fg: '#047857' },
  rejected: { label: 'Rejected', bg: '#FFE4E6', fg: '#BE123C' },
  suspended: { label: 'Suspended', bg: '#E5E5E5', fg: '#404040' },
};

type MenuItem = {
  key: string;
  label: string;
  sublabel?: string;
  icon: typeof Wallet;
  iconBg: string;
  iconColor: string;
  onPress: () => void;
};

function MenuSection({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      <View style={styles.sectionCard}>
        {items.map((item, index) => (
          <Pressable
            key={item.key}
            onPress={item.onPress}
            style={({ pressed }) => [styles.row, index < items.length - 1 && styles.rowDivider, pressed && styles.rowPressed]}>
            <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
              <item.icon color={item.iconColor} size={19} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              {item.sublabel ? <Text style={styles.rowSub}>{item.sublabel}</Text> : null}
            </View>
            <View style={styles.chevron}>
              <ChevronRight color={colors.mutedForeground} size={16} />
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<AppNavigation>();
  const statusMeta = STATUS_META[user?.status || 'pending'] || STATUS_META.pending;

  const handleLogout = () =>
    Alert.alert('Log out?', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout() },
    ]);

  const accountItems: MenuItem[] = [
    {
      key: 'wallet',
      label: 'Wallet',
      sublabel: 'Balance, top-ups and transactions',
      icon: Wallet,
      iconBg: '#FBEFD6',
      iconColor: colors.primary,
      onPress: () => navigation.navigate('Wallet'),
    },
    {
      key: 'earnings',
      label: 'Earnings & Commission',
      sublabel: 'What you earned after platform commission',
      icon: Percent,
      iconBg: '#E0F4E7',
      iconColor: '#16A34A',
      onPress: () => navigation.navigate('Earnings'),
    },
    {
      key: 'bookings',
      label: 'Booking History',
      sublabel: 'Accepted, declined and cancelled jobs',
      icon: Calendar,
      iconBg: '#E1ECFC',
      iconColor: '#2563EB',
      onPress: () => navigation.navigate('Bookings'),
    },
    {
      key: 'notifications',
      label: 'Notifications',
      sublabel: 'Alerts about requests and payouts',
      icon: Bell,
      iconBg: '#F0E4FB',
      iconColor: '#7C3AED',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      key: 'kyc',
      label: 'Verification (KYC)',
      sublabel: 'Identity, licence, GST and bank details',
      icon: ShieldCheck,
      iconBg: '#E0F4E7',
      iconColor: '#16A34A',
      onPress: () => navigation.navigate('Kyc'),
    },
    {
      key: 'vehicles',
      label: 'Vehicles',
      sublabel: 'Your fleet, capacity and documents',
      icon: Truck,
      iconBg: '#FBEFD6',
      iconColor: colors.primary,
      onPress: () => navigation.navigate('Vehicles'),
    },
    {
      key: 'drivers',
      label: 'Drivers',
      sublabel: 'Drivers and their licences',
      icon: UserRound,
      iconBg: '#E1ECFC',
      iconColor: '#2563EB',
      onPress: () => navigation.navigate('Drivers'),
    },
    {
      key: 'withdrawals',
      label: 'Withdrawals',
      sublabel: 'Move earnings to your bank',
      icon: Banknote,
      iconBg: '#E0F4E7',
      iconColor: '#16A34A',
      onPress: () => navigation.navigate('Withdrawals'),
    },
    {
      key: 'jobs',
      label: 'Drivers for Job',
      sublabel: 'Find driver jobs or post one to hire',
      icon: Briefcase,
      iconBg: '#E8E6F9',
      iconColor: '#4B3FA6',
      onPress: () => navigation.navigate('Jobs'),
    },
    {
      key: 'reviews',
      label: 'Ratings & Reviews',
      sublabel: 'What customers say about your trips',
      icon: Star,
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
      onPress: () => navigation.navigate('Reviews'),
    },
  ];

  const moreItems: MenuItem[] = [
    { key: 'support', label: 'Help & Support', icon: LifeBuoy, iconBg: '#E0F4E7', iconColor: '#16A34A', onPress: () => navigation.navigate('HelpSupport') },
    { key: 'about', label: 'About Ashwa India', icon: Info, iconBg: '#E1ECFC', iconColor: '#2563EB', onPress: () => navigation.navigate('About') },
    { key: 'settings', label: 'Settings', icon: SettingsIcon, iconBg: colors.muted, iconColor: colors.mutedForeground, onPress: () => navigation.navigate('Settings') },
  ];

  return (
    <Screen style={styles.noPadding}>
      <LightHeader title="Profile" bar titleSize={16} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Truck color={colors.primary} size={26} />
            </View>
          </View>
          <View style={styles.flex}>
            <Text style={styles.name} numberOfLines={1}>
              {user?.businessName || user?.name || 'Transporter'}
            </Text>
            <Text style={styles.phone}>{user?.phone}</Text>
            <Text style={[styles.status, { backgroundColor: statusMeta.bg, color: statusMeta.fg }]}>{statusMeta.label}</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.editBtn, pressed && styles.editPressed]}
          onPress={() => navigation.navigate('EditProfile')}>
          <Pencil color={colors.primary} size={15} />
          <Text style={styles.editText}>Edit Profile</Text>
        </Pressable>

        <MenuSection title="Account" items={accountItems} />
        <MenuSection title="More" items={moreItems} />

        <Pressable style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed]} onPress={handleLogout}>
          <View style={[styles.iconWrap, styles.logoutIcon]}>
            <LogOut color="#ef4444" size={18} />
          </View>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1, minWidth: 0 },
  content: { paddingBottom: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.navy,
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
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.navyLight, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: '700', color: colors.white },
  phone: { fontSize: 13, color: colors.navyMuted, marginTop: 2 },
  status: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: spacing.md,
    marginTop: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingVertical: 12,
  },
  editPressed: { backgroundColor: colors.accent },
  editText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  section: { marginTop: spacing.lg, paddingHorizontal: spacing.md },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, color: colors.mutedForeground, marginBottom: spacing.sm },
  sectionCard: { overflow: 'hidden', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.md, paddingVertical: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowPressed: { backgroundColor: colors.muted },
  iconWrap: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  rowSub: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  chevron: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  logoutPressed: { backgroundColor: '#FFF1F2' },
  logoutIcon: { backgroundColor: '#FEE2E2' },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#ef4444' },
});
