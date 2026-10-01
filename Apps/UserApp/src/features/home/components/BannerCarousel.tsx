import React, { useEffect, useRef, useState } from 'react';
import {
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

const DEFAULT_ASPECT_RATIO = 16 / 7;

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  // Shared aspect ratio across every slide (taken from the first image that loads)
  // keeps the carousel's height stable as the user swipes, instead of jumping
  // between differently-sized banners.
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  // The carousel renders inside a padded parent (HeroSection), so its real
  // width is narrower than the screen — measure it instead of assuming
  // Dimensions.get('window').width, which caused slides to overflow the
  // actual viewport and show a square, un-rounded edge on one side.
  const [pageWidth, setPageWidth] = useState(0);
  const listRef = useRef<FlatList>(null);
  const activeIndexRef = useRef(0);
  // HeroSection's own paddingHorizontal already insets this carousel from the
  // screen edges, so slides fill the full measured width — no extra inset
  // here, or the banner ends up with a visibly oversized side gap.
  const slideWidth = pageWidth;

  useEffect(() => {
    if (banners.length < 2 || !pageWidth) return;
    const timer = setInterval(() => {
      const nextIndex = (activeIndexRef.current + 1) % banners.length;
      listRef.current?.scrollToOffset({ offset: nextIndex * pageWidth, animated: true });
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length, pageWidth]);

  if (!banners.length) return null;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!pageWidth) return;
    const index = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    activeIndexRef.current = index;
    setActiveIndex(index);
  };

  const handleImageLoad = (width: number, height: number) => {
    if (!width || !height || aspectRatio) return;
    setAspectRatio(width / height);
  };

  return (
    <View style={styles.wrapper} onLayout={e => setPageWidth(e.nativeEvent.layout.width)}>
      {pageWidth > 0 && (
        <FlatList
          ref={listRef}
          data={banners}
          keyExtractor={item => item._id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          onScroll={onScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <View style={{ width: pageWidth, alignItems: 'center' }}>
              <Image
                source={{ uri: getMediaUrl(item.image) }}
                style={[
                  styles.slide,
                  {
                    width: slideWidth,
                    aspectRatio: aspectRatio ?? DEFAULT_ASPECT_RATIO,
                  },
                ]}
                resizeMode="cover"
                onLoad={e => {
                  const { width, height } = e.nativeEvent.source;
                  handleImageLoad(width, height);
                }}
              />
            </View>
          )}
        />
      )}
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
