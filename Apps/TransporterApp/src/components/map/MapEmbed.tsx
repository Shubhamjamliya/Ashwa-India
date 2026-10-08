import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { mapEmbedUrl } from '../../utils/geo';

// Read-only OpenStreetMap view with a marker, the same embed the web panel shows.
export function MapEmbed({ lat, lng, style }: { lat: number; lng: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <WebView source={{ uri: mapEmbedUrl(lat, lng) }} style={styles.web} nestedScrollEnabled setSupportMultipleWindows={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: '#F1EEE6' },
});
