import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../../../theme/colors';
import { getMediaUrl } from '../../../services/media';
import type { Banner } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - spacing.md * 2;
const DEFAULT_ASPECT_RATIO = 16 / 7;

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  // Shared aspect ratio across every slide (taken from the first image that loads)
  // keeps the carousel's height stable as the user swipes, instead of jumping
  // between differently-sized banners.
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const listRef = useRef<FlatList>(null);

  if (!banners.length) return null;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH);
    setActiveIndex(index);
  };

  const handleImageLoad = (width: number, height: number) => {
    if (!width || !height || aspectRatio) return;
    setAspectRatio(width / height);
  };

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={listRef}
        data={banners}
        keyExtractor={item => item._id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SLIDE_WIDTH}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: spacing.md }}
        renderItem={({ item }) => (
          <Image
            source={{ uri: getMediaUrl(item.image) }}
            style={[
              styles.slide,
              {
                width: SLIDE_WIDTH,
                aspectRatio: aspectRatio ?? DEFAULT_ASPECT_RATIO,
              },
            ]}
            resizeMode="cover"
            onLoad={e => {
              const { width, height } = e.nativeEvent.source;
              handleImageLoad(width, height);
            }}
          />
        )}
      />
      {banners.length > 1 && (
        <View style={styles.dots}>
          {banners.map((b, i) => (
            <View key={b._id} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  slide: {
    borderRadius: radius.lg,
    backgroundColor: colors.muted,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primary,
  },
});
