import type { StyleProp, ViewStyle } from 'react-native';

export type MapPoint = { lat: number; lng: number };

export type RouteMapHandle = {
  panTo: (point: MapPoint, zoom?: number) => void;
};

export type RouteMapProps = {
  initialCenter: MapPoint;
  initialZoom: number;
  source: MapPoint | null;
  destination: MapPoint | null;
  // The map centre after the user drags the map (never after the app moves it).
  onCenterChange: (point: MapPoint) => void;
  onReady?: () => void;
  // True while a finger is on the map, so a parent ScrollView can stop scrolling meanwhile.
  onTouchActive?: (active: boolean) => void;
  style?: StyleProp<ViewStyle>;
};
