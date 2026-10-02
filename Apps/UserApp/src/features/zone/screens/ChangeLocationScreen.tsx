import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, Crosshair, MapPin, Search } from 'lucide-react-native';
import { Screen } from '../../../components/Screen';
import { Input } from '../../../components/Input';
import { colors, radius, spacing } from '../../../theme/colors';
import { searchPlaces, type PlaceSuggestion } from '../../../services/geocoding';

type Props = {
  onSelect: (loc: { lat: number; lng: number; label: string }) => void;
  onUseCurrentLocation: () => void;
  onClose?: () => void;
};

export function ChangeLocationScreen({ onSelect, onUseCurrentLocation, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);

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
    onSelect({ lat: s.lat, lng: s.lng, label: s.title });
  };

  return (
    <Screen style={styles.noPadding}>
      <View style={styles.header}>
        {onClose ? (
          <Pressable onPress={onClose} hitSlop={12} style={styles.backBtn}>
            <ArrowLeft color={colors.foreground} size={20} />
          </Pressable>
        ) : (
          <View style={styles.backBtnPlaceholder} />
        )}
        <Text style={styles.title}>Change Location</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.currentLocationBtn} onPress={onUseCurrentLocation}>
          <Crosshair color={colors.primary} size={18} />
          <Text style={styles.currentLocationText}>Use current location</Text>
        </Pressable>

        <View style={styles.searchWrap}>
          <Search color={colors.mutedForeground} size={16} style={styles.searchIcon} />
          <Input
            placeholder="Search for your area, city..."
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            autoFocus
          />
          {searching && <ActivityIndicator size="small" color={colors.primary} style={styles.searchSpinner} />}
        </View>

        {suggestions.map(s => (
          <Pressable key={s.id} style={styles.suggestionRow} onPress={() => pick(s)}>
            <MapPin color={colors.mutedForeground} size={16} />
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
  backBtnPlaceholder: {
    width: 36,
    height: 36,
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
  currentLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  currentLocationText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accentForeground,
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
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  },
});
