import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Crosshair, MapPin, Search } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { colors, radius, spacing } from '../../../theme/colors';
import { getCurrentPosition } from '../../../services/location';
import { useAddresses } from '../../../context/AddressContext';
import { reverseGeocode, searchPlaces, staticMapUrl, type PlaceSuggestion } from '../../../services/geocoding';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'AddressForm'>;
type Rt = RouteProp<HomeStackParamList, 'AddressForm'>;

const LABELS = ['Home', 'Work', 'Other'];

function Field({
  label,
  style,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View style={style}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput placeholderTextColor={colors.mutedForeground} style={styles.input} {...props} />
    </View>
  );
}

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
  const [locating, setLocating] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

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
    setError('');
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
      () => {
        setLocating(false);
        setError('Could not get your location. Allow location access and try again.');
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const handleSave = () => {
    if (!line1.trim() || !city.trim()) {
      setError('Address line and city are required');
      return;
    }
    const payload = { label, line1: line1.trim(), city: city.trim(), state: state.trim(), pincode: pincode.trim(), lat, lng };
    if (editing) {
      updateAddress(editing.id, payload);
      if (params?.selectOnSave) selectAddress(editing.id);
    } else {
      const created = addAddress(payload);
      if (params?.selectOnSave) selectAddress(created.id);
    }
    // Opened from the checkout's address picker: return to the checkout itself.
    if (params?.selectOnSave) navigation.pop(2);
    else navigation.goBack();
  };

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title={editing ? 'Edit Address' : 'Add Address'} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.mapCard}>
          <View style={styles.map}>
            {lat != null && lng != null ? (
              <Image source={{ uri: staticMapUrl(lat, lng) }} style={styles.fill} resizeMode="cover" />
            ) : (
              <View style={styles.mapEmpty}>
                <MapPin color={colors.mutedForeground} size={24} />
                <Text style={styles.mapEmptyText}>Search or use current location to pin a spot</Text>
              </View>
            )}
          </View>
          <Pressable style={[styles.locateBtn, locating && styles.disabled]} onPress={handleUseCurrentLocation} disabled={locating}>
            {locating ? <ActivityIndicator size="small" color={colors.primary} /> : <Crosshair color={colors.primary} size={16} />}
            <Text style={styles.locateText}>{locating ? 'Locating...' : 'Use current location'}</Text>
          </Pressable>
        </View>

        <View>
          <View style={styles.searchBox}>
            <Search color={colors.primary} size={16} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search to update pinned location..."
              placeholderTextColor={colors.mutedForeground}
              style={styles.searchInput}
            />
            {searching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
          </View>
          {suggestions.length > 0 ? (
            <View style={styles.suggestions}>
              {suggestions.map(s => (
                <Pressable key={s.id} style={styles.suggestion} onPress={() => applySuggestion(s)}>
                  <MapPin color={colors.mutedForeground} size={14} />
                  <View style={styles.flex}>
                    <Text style={styles.suggestionTitle} numberOfLines={1}>
                      {s.title}
                    </Text>
                    <Text style={styles.suggestionSub} numberOfLines={1}>
                      {s.subtitle}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <Field label="Address Line *" value={line1} onChangeText={setLine1} placeholder="House no., street, area" />
        <View style={styles.row3}>
          <Field label="City *" value={city} onChangeText={setCity} style={styles.flex} />
          <Field label="State" value={state} onChangeText={setState} style={styles.flex} />
          <Field
            label="Pincode"
            value={pincode}
            onChangeText={t => setPincode(t.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.flex}
          />
        </View>

        <View>
          <Text style={styles.saveAs}>Save address as</Text>
          <View style={styles.labels}>
            {LABELS.map(l => {
              const active = label === l;
              return (
                <Pressable key={l} onPress={() => setLabel(l)} style={[styles.labelChip, active && styles.labelChipActive]}>
                  <Text style={[styles.labelText, active && styles.labelTextActive]}>{l}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>{editing ? 'Update Address' : 'Save Address'}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1, minWidth: 0 },
  fill: { width: '100%', height: '100%' },
  disabled: { opacity: 0.6 },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xl },
  mapCard: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  map: { height: 140, backgroundColor: colors.muted },
  mapEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  mapEmptyText: { fontSize: 12, color: colors.mutedForeground, textAlign: 'center' },
  locateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  locateText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  searchBox: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.foreground, paddingVertical: 0 },
  suggestions: {
    marginTop: 4,
    overflow: 'hidden',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionTitle: { fontSize: 12, fontWeight: '700', color: colors.foreground },
  suggestionSub: { fontSize: 10, color: colors.mutedForeground },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.foreground, marginBottom: 6 },
  input: {
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: 14,
    color: colors.foreground,
  },
  row3: { flexDirection: 'row', gap: spacing.sm },
  saveAs: { fontSize: 12, fontWeight: '700', color: colors.foreground, marginBottom: spacing.sm },
  labels: { flexDirection: 'row', gap: spacing.sm },
  labelChip: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingVertical: 10,
  },
  labelChipActive: { borderColor: colors.primary, backgroundColor: colors.accent },
  labelText: { fontSize: 14, fontWeight: '700', color: '#525252' },
  labelTextActive: { color: colors.accentForeground },
  error: { fontSize: 13, color: colors.destructive },
  saveBtn: { borderRadius: radius.md, backgroundColor: colors.primary, paddingVertical: 12, alignItems: 'center' },
  saveText: { fontSize: 14, fontWeight: '700', color: colors.white },
});
