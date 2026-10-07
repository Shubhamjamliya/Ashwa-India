import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { mapEmbedUrl } from '../../utils/geo';

const Frame: any = 'iframe';
const frameStyle = { border: 0, width: '100%', height: '100%' };

export function MapEmbed({ lat, lng, style }: { lat: number; lng: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <Frame title="Live location" src={mapEmbedUrl(lat, lng)} loading="lazy" style={frameStyle} />
    </View>
  );
}
