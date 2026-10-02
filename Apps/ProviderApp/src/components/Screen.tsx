import React from 'react';
import { StatusBar, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { colors } from '../theme/colors';

export function Screen({
  children,
  style,
  topColor,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  topColor?: string;
}) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  return (
    <View style={styles.safe}>
      {isFocused && <StatusBar barStyle={topColor ? 'light-content' : 'dark-content'} />}
      {topColor ? (
        <View style={{ height: insets.top, backgroundColor: topColor }} />
      ) : null}
      <SafeAreaView style={styles.safe} edges={topColor ? ['bottom'] : ['top', 'bottom']}>
        <View style={[styles.container, style]}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
