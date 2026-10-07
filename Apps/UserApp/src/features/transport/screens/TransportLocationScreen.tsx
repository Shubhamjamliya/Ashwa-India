import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ArrowDownUp, Crosshair, LocateFixed, MapPin, Truck, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { RouteMap } from '../../../components/map/RouteMap';
import type { MapPoint, RouteMapHandle } from '../../../components/map/types';
import { colors, radius, spacing } from '../../../theme/colors';
import { getCurrentPosition } from '../../../services/location';
import { reverseGeocode, searchPlaces, type PlaceSuggestion } from '../../../services/geocoding';
import { useLocationContext } from '../../../context/LocationContext';
import { distanceKm } from '../../../utils/geo';
import type { HomeStackParamList } from '../../../navigation/types';
import type { TransportPoint } from '../types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'TransportLocation'>;
type Field = 'source' | 'destination';

const INDIA = { lat: 20.5937, lng: 78.9629 }; // until a point is set or the device is located
const PIN_FILL: Record<Field, string> = { source: '#10B981', destination: '#F43F5E' };
const PIN_STROKE: Record<Field, string> = { source: '#047857', destination: '#BE123C' };

export function TransportLocationScreen() {
  const navigation = useNavigation<Nav>();
  const { location } = useLocationContext();
  const mapRef = useRef<RouteMapHandle>(null);
  const [initialCenter] = useState<MapPoint>(() =>
    location?.lat != null ? { lat: location.lat, lng: location.lng } : INDIA,
  );

  const [points, setPoints] = useState<Record<Field, TransportPoint | null>>({ source: null, destination: null });
  const [texts, setTexts] = useState<Record<Field, string>>({ source: '', destination: '' });
  const [active, setActive] = useState<Field>('source');
  const [typing, setTyping] = useState<Field | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [ready, setReady] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapTouched, setMapTouched] = useState(false);
  const [error, setError] = useState('');
  const activeRef = useRef(active);
  activeRef.current = active;

  // Place suggestions for whichever box is being typed in.
  const query = typing ? texts[typing].trim() : '';
  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      searchPlaces(query)
        .then(setSuggestions)
        .catch(() => setSuggestions([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const setPoint = (field: Field, point: TransportPoint | null) => setPoints(prev => ({ ...prev, [field]: point }));

  // Moves the chosen field's pin to a spot and fills in its address.
  const pinAt = async (field: Field, lat: number, lng: number) => {
    setResolving(true);
    const place = await reverseGeocode(lat, lng);
    setResolving(false);
    const address = place?.formatted || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    setTexts(prev => ({ ...prev, [field]: address }));
    setPoint(field, { address, lat, lng });
  };

  const pickSuggestion = (field: Field, s: PlaceSuggestion) => {
    const address = [s.title, s.subtitle].filter(Boolean).join(', ');
    setTexts(prev => ({ ...prev, [field]: address }));
    setPoint(field, { address, lat: s.lat, lng: s.lng });
    setSuggestions([]);
    setTyping(null);
    Keyboard.dismiss();
    setActive(field === 'source' ? 'destination' : 'source');
    mapRef.current?.panTo({ lat: s.lat, lng: s.lng }, 16);
  };

  // Choosing a field moves the map to that field's point, if it has one.
  const choose = (field: Field) => {
    setActive(field);
    const point = points[field];
    if (point) mapRef.current?.panTo(point);
  };

  const clearField = (field: Field) => {
    setTexts(prev => ({ ...prev, [field]: '' }));
    setPoint(field, null);
    setActive(field);
  };

  const swap = () => {
    setTexts(prev => ({ source: prev.destination, destination: prev.source }));
    setPoints(prev => ({ source: prev.destination, destination: prev.source }));
  };

  const useCurrentLocation = () => {
    setLocating(true);
    setError('');
    getCurrentPosition(
      position => {
        setLocating(false);
        const { latitude, longitude } = position.coords;
        mapRef.current?.panTo({ lat: latitude, lng: longitude }, 16);
        // The user asked for their location, so the chosen pin takes it.
        pinAt(activeRef.current, latitude, longitude);
      },
      () => {
        setLocating(false);
        setError('Allow location access, or search for the place');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const { source, destination } = points;
  const km = source && destination ? distanceKm(source, destination) : null;

  const renderInput = (field: Field) => {
    const isActive = active === field;
    return (
      <View>
        <View style={styles.inputWrap}>
          <View style={[styles.dot, field === 'source' ? styles.dotSource : styles.dotDest]} />
          <TextInput
            value={texts[field]}
            onFocus={() => {
              choose(field);
              setTyping(field);
            }}
            onBlur={() => setTyping(t => (t === field ? null : t))}
            onChangeText={t => {
              setTexts(prev => ({ ...prev, [field]: t }));
              setTyping(field);
            }}
            placeholder={field === 'source' ? 'Pickup location' : 'Drop-off location'}
            placeholderTextColor="#A3A3A3"
            style={[styles.input, isActive && styles.inputActive]}
          />
          {texts[field] ? (
            <Pressable style={styles.clearBtn} hitSlop={8} onPress={() => clearField(field)}>
              <X color="#525252" size={14} />
            </Pressable>
          ) : null}
        </View>
        {typing === field && (searching || suggestions.length > 0) ? (
          <View style={styles.suggestions}>
            {searching && suggestions.length === 0 ? (
              <ActivityIndicator style={styles.searchSpinner} size="small" color={colors.primary} />
            ) : (
              suggestions.map(s => (
                <Pressable key={s.id} style={styles.suggestion} onPress={() => pickSuggestion(field, s)}>
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
              ))
            )}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title="Horse Transport" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" scrollEnabled={!mapTouched}>
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <Truck color={colors.primary} size={24} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.introTitle}>Where is your horse going?</Text>
            <Text style={styles.introText}>Set the pickup and drop-off, then check the map.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Route</Text>
            <Pressable style={[styles.inline, !source && !destination && styles.faded]} disabled={!source && !destination} onPress={swap}>
              <ArrowDownUp color={colors.primary} size={14} />
              <Text style={styles.swapText}>Swap</Text>
            </Pressable>
          </View>
          <View style={styles.routeInputs}>
            <View style={styles.connector} />
            {renderInput('source')}
            {renderInput('destination')}
          </View>
        </View>

        <View style={[styles.card, styles.mapCard]}>
          <View style={styles.mapHead}>
            <Text style={styles.cardTitle}>Pin on map</Text>
            <View style={styles.toggle}>
              {(['source', 'destination'] as Field[]).map(field => (
                <Pressable
                  key={field}
                  onPress={() => choose(field)}
                  style={[styles.toggleBtn, active === field && styles.toggleBtnActive]}>
                  <Text style={[styles.toggleText, active === field && styles.toggleTextActive]}>
                    {field === 'source' ? 'Pickup' : 'Drop-off'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.mapBox}>
            <RouteMap
              ref={mapRef}
              initialCenter={initialCenter}
              initialZoom={location?.lat != null ? 14 : 5}
              source={source}
              destination={destination}
              onCenterChange={p => pinAt(activeRef.current, p.lat, p.lng)}
              onReady={() => setReady(true)}
              onTouchActive={setMapTouched}
              style={styles.fill}
            />
            {!ready ? (
              <View style={styles.mapLoading} pointerEvents="none">
                <Text style={styles.hint}>Loading map...</Text>
              </View>
            ) : null}
            {/* Fixed pin in the middle. Its tip marks the spot for the chosen field. */}
            <View style={styles.centerPin} pointerEvents="none">
              <MapPin color={PIN_STROKE[active]} fill={PIN_FILL[active]} size={40} />
            </View>
            <Pressable style={[styles.locateBtn, (!ready || locating) && styles.faded]} disabled={!ready || locating} onPress={useCurrentLocation}>
              {locating ? <ActivityIndicator size="small" color={colors.primary} /> : <LocateFixed color={colors.navy} size={20} />}
            </Pressable>
          </View>

          <View style={styles.mapFoot}>
            <Crosshair color={colors.mutedForeground} size={14} />
            <Text style={styles.hint} numberOfLines={1}>
              {resolving
                ? 'Finding address...'
                : ready
                ? `Drag the map to move the ${active === 'source' ? 'pickup' : 'drop-off'} pin`
                : 'Loading map...'}
            </Text>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <View style={styles.card}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>DISTANCE</Text>
              <Text style={styles.statValue}>{km != null ? `${km.toFixed(1)} km` : '—'}</Text>
              <Text style={styles.statHint}>Straight line</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>PRICE</Text>
              <Text style={styles.statValue}>Shown next</Text>
              <Text style={styles.statHint}>Per km, from each transporter</Text>
            </View>
          </View>
          <Pressable
            style={[styles.cta, (!source || !destination) && styles.faded]}
            disabled={!source || !destination}
            onPress={() => source && destination && navigation.navigate('TransportResults', { source, destination })}>
            <Text style={styles.ctaText}>Find available transport</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1, minWidth: 0 },
  fill: { width: '100%', height: '100%' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  faded: { opacity: 0.4 },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xl },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.navy,
    padding: spacing.md,
  },
  introIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(194,141,46,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: { fontSize: 14, fontWeight: '700', color: colors.white },
  introText: { fontSize: 12, color: colors.navyMuted },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  swapText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  routeInputs: { gap: 10 },
  connector: {
    position: 'absolute',
    left: 18,
    top: 24,
    bottom: 24,
    borderLeftWidth: 2,
    borderStyle: 'dotted',
    borderColor: '#D4D4D4',
  },
  inputWrap: { justifyContent: 'center' },
  dot: { position: 'absolute', left: 14, zIndex: 1, width: 12, height: 12, borderRadius: 6 },
  dotSource: { borderWidth: 2, borderColor: '#10B981', backgroundColor: colors.white },
  dotDest: { backgroundColor: '#F43F5E' },
  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: colors.background,
    paddingLeft: 40,
    paddingRight: 40,
    paddingVertical: 0,
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  inputActive: { borderColor: colors.primary, backgroundColor: colors.white },
  clearBtn: {
    position: 'absolute',
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestions: {
    marginTop: 4,
    overflow: 'hidden',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  searchSpinner: { paddingVertical: 12 },
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
  mapCard: { padding: 0, overflow: 'hidden' },
  mapHead: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 12,
  },
  toggle: { flexDirection: 'row', marginLeft: 'auto', borderRadius: radius.full, backgroundColor: colors.muted, padding: 2 },
  toggleBtn: { borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4 },
  toggleBtnActive: { backgroundColor: colors.navy },
  toggleText: { fontSize: 12, fontWeight: '700', color: '#525252' },
  toggleTextActive: { color: colors.white },
  mapBox: { height: 320, backgroundColor: '#F5F5F5' },
  mapLoading: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  centerPin: { position: 'absolute', left: '50%', top: '50%', marginLeft: -20, marginTop: -40 },
  locateBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  mapFoot: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 12 },
  hint: { flex: 1, fontSize: 11, color: colors.mutedForeground },
  error: { fontSize: 12, color: colors.destructive, paddingHorizontal: spacing.md, paddingBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stat: { flex: 1, borderRadius: radius.md, backgroundColor: colors.background, padding: 12 },
  statLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, color: colors.mutedForeground },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.foreground, marginTop: 2 },
  statHint: { fontSize: 10, color: colors.mutedForeground },
  cta: {
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 14, fontWeight: '700', color: colors.white },
});
