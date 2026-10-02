import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
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
  // Measure the actual rendered width instead of assuming
  // Dimensions.get('window').width, which caused slides to overflow the
  // real viewport and show a square, un-rounded edge on one side.
  const [pageWidth, setPageWidth] = useState(0);
  const listRef = useRef<FlatList>(null);
  const activeIndexRef = useRef(0);
  // This component now sits directly on the screen (not inside a padded
  // parent), so it insets itself from the screen edges.
  const slideWidth = pageWidth - spacing.md * 2;

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
              <View
                style={[
                  styles.slide,
                  {
                    width: slideWidth,
                    aspectRatio: aspectRatio ?? DEFAULT_ASPECT_RATIO,
                  },
                ]}>
                <Image
                  source={{ uri: getMediaUrl(item.image) }}
                  style={styles.image}
                  resizeMode="cover"
                  onLoad={e => {
                    const { width, height } = e.nativeEvent.source;
                    handleImageLoad(width, height);
                  }}
                />
                {item.title ? (
                  <View style={styles.titleBadge}>
                    <Text style={styles.titleBadgeText} numberOfLines={1}>
                      {item.title.toUpperCase()}
                    </Text>
                  </View>
                ) : null}
                {item.subtitle ? (
                  <Text style={styles.subtitleText} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                ) : null}
                {item.link ? (
                  <View style={styles.arrowBtn}>
                    <ChevronRight color={colors.white} size={18} />
                  </View>
                ) : null}
              </View>
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
  },
  slide: {
    borderRadius: radius.lg,
    backgroundColor: colors.muted,
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  titleBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  titleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.4,
  },
  subtitleText: {
    position: 'absolute',
    left: 14,
    right: 60,
    bottom: 14,
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
    lineHeight: 21,
  },
  arrowBtn: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
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
