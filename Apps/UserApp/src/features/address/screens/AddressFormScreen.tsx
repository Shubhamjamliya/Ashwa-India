import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowLeft, Crosshair, MapPin, Search } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { colors, radius, spacing } from '../../../theme/colors';
import { getCurrentPosition } from '../../../services/location';
import { useAddresses } from '../../../context/AddressContext';
import { reverseGeocode, searchPlaces, staticMapUrl, type PlaceSuggestion } from '../../../services/geocoding';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'AddressForm'>;
type Rt = RouteProp<HomeStackParamList, 'AddressForm'>;

const LABELS = ['Home', 'Work', 'Other'];

export function AddressFormScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { addresses, addAddress, updateAddress, selectAddress } = useAddresses();

  const editing = params?.editId ? addresses.find(a => a.id === params.editId) : undefined;

  const [label, setLabel] = useState(editing?.label || 'Home');
  const [line1, setLine1] = useState(editing?.line1 || params?.presetLine1 || '');
  const [city, setCity] = useState(editing?.city || params?.presetCity || '');
  const [state, setState] = useState(editing?.state || params?.presetState || '');
  const [pincode, setPincode] = useState(editing?.pincode || params?.presetPincode || '');
  const [lat, setLat] = useState<number | undefined>(editing?.lat ?? params?.presetLat);
  const [lng, setLng] = useState<number | undefined>(editing?.lng ?? params?.presetLng);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

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

  const applySuggestion = (s: PlaceSuggestion) => {
    setLat(s.lat);
    setLng(s.lng);
    if (s.line1) setLine1(s.line1);
    if (s.city) setCity(s.city);
    if (s.state) setState(s.state);
    if (s.pincode) setPincode(s.pincode);
    setQuery('');
    setSuggestions([]);
  };

  const handleUseCurrentLocation = () => {
    setLocating(true);
    getCurrentPosition(
      async position => {
        try {
          const { latitude, longitude } = position.coords;
          setLat(latitude);
          setLng(longitude);
          const place = await reverseGeocode(latitude, longitude);
          if (place) {
            if (place.line1) setLine1(place.line1);
            if (place.city) setCity(place.city);
            if (place.state) setState(place.state);
            if (place.pincode) setPincode(place.pincode);
          }
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const handleSave = () => {
    if (!line1.trim() || !city.trim()) return;
    const payload = { label, line1: line1.trim(), city: city.trim(), state: state.trim(), pincode: pincode.trim(), lat, lng };
    setSaving(true);
    try {
      if (editing) {
        updateAddress(editing.id, payload);
        if (params?.selectOnSave) selectAddress(editing.id);
      } else {
        const created = addAddress(payload);
        if (params?.selectOnSave) selectAddress(created.id);
      }
      if (params?.selectOnSave) {
        navigation.pop(2);
      } else {
        navigation.goBack();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen style={styles.noPadding}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft color={colors.foreground} size={20} />
        </Pressable>
        <Text style={styles.title}>{editing ? 'Edit Address' : 'Add Address'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.mapWrap}>
          {lat != null && lng != null ? (
            <Image source={{ uri: staticMapUrl(lat, lng) }} style={styles.mapImage} resizeMode="cover" />
          ) : (
            <View style={[styles.mapImage, styles.mapPlaceholder]}>
              <MapPin color={colors.mutedForeground} size={24} />
              <Text style={styles.mapPlaceholderText}>Search or use current location to pin a spot</Text>
            </View>
          )}
          <Pressable style={styles.locateBtn} onPress={handleUseCurrentLocation} disabled={locating}>
            {locating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Crosshair color={colors.primary} size={16} />
            )}
            <Text style={styles.locateBtnText}>{locating ? 'Locating...' : 'Use current location'}</Text>
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Search color={colors.primary} size={16} style={styles.searchIcon} />
          <Input
            placeholder="Search to update pinned location..."
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
          {searching && (
            <ActivityIndicator size="small" color={colors.primary} style={styles.searchSpinner} />
          )}
          {suggestions.length > 0 && (
            <View style={styles.suggestionCard}>
              {suggestions.map(s => (
                <Pressable key={s.id} style={styles.suggestionRow} onPress={() => applySuggestion(s)}>
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

        <Input label="Address Line *" value={line1} onChangeText={setLine1} placeholder="House no., street, area" />
        <View style={styles.row2}>
          <View style={styles.cityField}>
            <Input label="City *" value={city} onChangeText={setCity} />
          </View>
          <View style={styles.stateField}>
            <Input label="State" value={state} onChangeText={setState} />
          </View>
          <View style={styles.pincodeField}>
            <Input label="Pincode" value={pincode} onChangeText={setPincode} keyboardType="number-pad" maxLength={6} />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Save address as</Text>
        <View style={styles.labelRow}>
          {LABELS.map(l => {
            const active = label === l;
            return (
              <Pressable
                key={l}
                style={[styles.labelChip, active && styles.labelChipActive]}
                onPress={() => setLabel(l)}>
                <Text style={[styles.labelChipText, active && styles.labelChipTextActive]}>{l}</Text>
              </Pressable>
            );
          })}
        </View>

        <Button
          title={saving ? 'Saving...' : 'Save Address'}
          onPress={handleSave}
          loading={saving}
          disabled={!line1.trim() || !city.trim()}
          style={styles.saveBtn}
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
    gap: spacing.sm,
  },
  mapWrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  mapImage: {
    width: '100%',
    height: 160,
    backgroundColor: colors.muted,
  },
  mapPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
  },
  mapPlaceholderText: {
    fontSize: 12,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  locateBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locateBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  searchWrap: {
    position: 'relative',
    marginBottom: spacing.xs,
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
  row2: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cityField: {
    flex: 1.4,
  },
  stateField: {
    flex: 1.1,
  },
  pincodeField: {
    flex: 0.9,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  labelRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  labelChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  labelChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  labelChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
  },
  labelChipTextActive: {
    color: colors.white,
  },
  saveBtn: {
    marginTop: spacing.sm,
  },
});
