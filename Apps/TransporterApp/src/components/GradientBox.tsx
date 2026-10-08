import React, { useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

// A box with a top-left to bottom-right gradient (the web's bg-gradient-to-br).
export function GradientBox({
  from,
  to,
  style,
  children,
}: {
  from: string;
  to: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const id = useId().replace(/:/g, '');
  return (
    <View style={[styles.box, style]}>
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden' },
});
