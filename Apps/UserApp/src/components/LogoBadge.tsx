import React from 'react';
import { Image, Text } from 'react-native';

export function LogoBadge({ size = 88, logoUrl }: { size?: number; logoUrl?: string | null }) {
  if (logoUrl) {
    return (
      <Image
        source={{ uri: logoUrl }}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    );
  }
  return <Text style={{ fontSize: size * 0.6 }}>🐎</Text>;
}
