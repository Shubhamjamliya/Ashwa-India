import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Briefcase,
  ChevronRight,
  Crosshair,
  Home as HomeIcon,
  MapPin,
  Plus,
  Search,
  X,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getCurrentPosition } from '../../../services/location';
import { Screen } from '../../../components/Screen';
import { Input } from '../../../components/Input';
import { colors, radius, spacing } from '../../../theme/colors';
import { useAddresses, type Address } from '../../../context/AddressContext';
import { reverseGeocode, searchPlaces, type PlaceSuggestion } from '../../../services/geocoding';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'SelectAddress'>;

function addressIcon(address: Address) {
  const label = address.label.toLowerCase();
  if (label.includes('work') || label.includes('office')) return Briefcase;
  if (label.includes('home')) return HomeIcon;
  return MapPin;
}

export function SelectAddressScreen() {
  const navigation = useNavigation<Nav>();
  const { addresses, selectAddress } = useAddresses();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      searchPlaces(q)
        .then(setSuggestions)
        .catch(() => setSuggestions([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const handleSelectSaved = (address: Address) => {
    selectAddress(address.id);
    navigation.goBack();
  };

  const handleSelectSuggestion = (s: PlaceSuggestion) => {
    navigation.navigate('AddressForm', {
      presetLat: s.lat,
      presetLng: s.lng,
      presetLine1: s.line1,
      presetCity: s.city,
      presetState: s.state,
      presetPincode: s.pincode,
      selectOnSave: true,
    });
  };

  const handleUseCurrentLocation = () => {
    setLocating(true);
    getCurrentPosition(
      async position => {
        try {
          const { latitude, longitude } = position.coords;
          const place = await reverseGeocode(latitude, longitude);
          navigation.navigate('AddressForm', {
            presetLat: latitude,
            presetLng: longitude,
            presetLine1: place?.line1,
            presetCity: place?.city,
            presetState: place?.state,
            presetPincode: place?.pincode,
            selectOnSave: true,
          });
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const handleEnterManually = () => {
    navigation.navigate('AddressForm', { selectOnSave: true });
  };

  return (
    <Screen style={styles.noPadding}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <X color={colors.foreground} size={20} />
        </Pressable>
        <Text style={styles.title}>Select delivery address</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.searchWrap}>
          <Search color={colors.primary} size={18} style={styles.searchIcon} />
          <Input
            placeholder="Search area, street, landmark..."
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
          {searching && (
            <ActivityIndicator size="small" color={colors.primary} style={styles.searchSpinner} />
          )}
        </View>

        {suggestions.length > 0 && (
          <View style={styles.suggestionCard}>
            {suggestions.map(s => (
              <Pressable
                key={s.id}
                style={styles.suggestionRow}
                onPress={() => handleSelectSuggestion(s)}>
                <MapPin color={colors.mutedForeground} size={16} style={styles.suggestionIcon} />
                <View style={styles.suggestionText}>
                  <Text style={styles.suggestionTitle} numberOfLines={1}>
                    {s.title}
                  </Text>
                  <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                    {s.subtitle}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.actionsCard}>
          <Pressable style={styles.actionRow} onPress={handleUseCurrentLocation} disabled={locating}>
            <View style={styles.actionIconWrap}>
              {locating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Crosshair color={colors.primary} size={18} />
              )}
            </View>
            <Text style={styles.actionLabel}>
              {locating ? 'Fetching location...' : 'Use current location'}
            </Text>
            <ChevronRight color={colors.mutedForeground} size={16} />
          </Pressable>
          <Pressable style={[styles.actionRow, styles.actionRowLast]} onPress={handleEnterManually}>
            <View style={styles.actionIconWrap}>
              <Plus color={colors.primary} size={18} />
            </View>
            <Text style={styles.actionLabel}>Enter address manually</Text>
            <ChevronRight color={colors.mutedForeground} size={16} />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Saved Addresses</Text>
        {addresses.length === 0 ? (
          <Text style={styles.emptyText}>No addresses saved yet.</Text>
        ) : (
          <View style={styles.savedCard}>
            {addresses.map((address, index) => {
              const Icon = addressIcon(address);
              return (
                <Pressable
                  key={address.id}
                  style={[
                    styles.savedRow,
                    index === addresses.length - 1 && styles.savedRowLast,
                  ]}
                  onPress={() => handleSelectSaved(address)}>
                  <View style={styles.actionIconWrap}>
                    <Icon color={colors.primary} size={18} />
                  </View>
                  <View style={styles.suggestionText}>
                    <Text style={styles.suggestionTitle}>{address.label}</Text>
                    <Text style={styles.suggestionSubtitle} numberOfLines={2}>
                      {[address.line1, address.city, address.state, address.pincode]
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                  </View>
                  <ChevronRight color={colors.mutedForeground} size={16} />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
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
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.foreground,
  },
  content: {
    padding: spacing.md,
    paddingTop: 0,
    paddingBottom: spacing.xl,
  },
  searchWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: 15,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 40,
  },
  searchSpinner: {
    position: 'absolute',
    right: 14,
    top: 15,
  },
  suggestionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionIcon: {
    marginTop: 2,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
  },
  suggestionSubtitle: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  actionsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionRowLast: {
    borderBottomWidth: 0,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  savedCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  savedRowLast: {
    borderBottomWidth: 0,
  },
});
