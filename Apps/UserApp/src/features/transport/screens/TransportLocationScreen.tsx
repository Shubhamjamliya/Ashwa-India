import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, Crosshair, MapPin, Search, Truck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { colors, radius, spacing } from '../../../theme/colors';
import { getCurrentPosition } from '../../../services/location';
import { reverseGeocode, searchPlaces, type PlaceSuggestion } from '../../../services/geocoding';
import type { HomeStackParamList } from '../../../navigation/types';
import type { TransportPoint } from '../types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'TransportLocation'>;

function LocationField({
  label,
  placeholder,
  value,
  onSelect,
  onClear,
  allowCurrentLocation,
}: {
  label: string;
  placeholder: string;
  value: TransportPoint | null;
  onSelect: (point: TransportPoint) => void;
  onClear: () => void;
  allowCurrentLocation?: boolean;
}) {
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

  const pick = (s: PlaceSuggestion) => {
    onSelect({ address: s.title, lat: s.lat, lng: s.lng });
    setQuery('');
    setSuggestions([]);
  };

  const useCurrentLocation = () => {
    setLocating(true);
    getCurrentPosition(
      async position => {
        try {
          const { latitude, longitude } = position.coords;
          const place = await reverseGeocode(latitude, longitude);
          onSelect({
            address: place?.formatted || place?.line1 || 'Current location',
            lat: latitude,
            lng: longitude,
          });
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {value ? (
        <Pressable style={styles.selectedRow} onPress={onClear}>
          <MapPin color={colors.primary} size={16} />
          <Text style={styles.selectedText} numberOfLines={2}>
            {value.address}
          </Text>
          <Text style={styles.changeText}>Change</Text>
        </Pressable>
      ) : (
        <View style={styles.searchWrap}>
          <Search color={colors.mutedForeground} size={16} style={styles.searchIcon} />
          <Input placeholder={placeholder} value={query} onChangeText={setQuery} style={styles.searchInput} />
          {searching && <ActivityIndicator size="small" color={colors.primary} style={styles.searchSpinner} />}
        </View>
      )}

      {!value && allowCurrentLocation && (
        <Pressable style={styles.locateBtn} onPress={useCurrentLocation} disabled={locating}>
          {locating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Crosshair color={colors.primary} size={14} />
          )}
          <Text style={styles.locateBtnText}>{locating ? 'Locating...' : 'Use current location'}</Text>
        </Pressable>
      )}

      {query.trim().length >= 3 && suggestions.length > 0 && (
        <View style={styles.suggestionCard}>
          {suggestions.map(s => (
            <Pressable key={s.id} style={styles.suggestionRow} onPress={() => pick(s)}>
              <MapPin color={colors.mutedForeground} size={14} />
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
    </View>
  );
}

export function TransportLocationScreen() {
  const navigation = useNavigation<Nav>();
  const [source, setSource] = useState<TransportPoint | null>(null);
  const [destination, setDestination] = useState<TransportPoint | null>(null);

  const canContinue = Boolean(source && destination);

  return (
    <Screen style={styles.noPadding}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft color={colors.foreground} size={20} />
        </Pressable>
        <Text style={styles.title}>Horse Transport</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heroIcon}>
          <Truck color={colors.primary} size={28} />
        </View>
        <Text style={styles.heroText}>Where are you moving your horse from and to?</Text>

        <LocationField
          label="Pickup location"
          placeholder="Search pickup location..."
          value={source}
          onSelect={setSource}
          onClear={() => setSource(null)}
          allowCurrentLocation
        />
        <LocationField
          label="Drop-off location"
          placeholder="Search drop-off location..."
          value={destination}
          onSelect={setDestination}
          onClear={() => setDestination(null)}
        />

        <Button
          title="Find Available Transport"
          onPress={() =>
            source &&
            destination &&
            navigation.navigate('TransportResults', { source, destination })
          }
          disabled={!canContinue}
          style={styles.submitBtn}
        />
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
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heroText: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: spacing.lg,
  },
  fieldWrap: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 6,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectedText: {
    flex: 1,
    fontSize: 13,
    color: colors.foreground,
    fontWeight: '600',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  searchWrap: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: 15,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 38,
  },
  searchSpinner: {
    position: 'absolute',
    right: 14,
    top: 15,
  },
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  locateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  suggestionCard: {
    marginTop: 4,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.foreground,
  },
  suggestionSubtitle: {
    fontSize: 10,
    color: colors.mutedForeground,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
});
