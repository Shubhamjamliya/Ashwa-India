import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, Heart, MapPin } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { colors, radius, spacing } from '../../../theme/colors';
import { getMediaUrl } from '../../../services/media';
import { useWishlist } from '../../../context/WishlistContext';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Wishlist'>;

export function WishlistScreen() {
  const navigation = useNavigation<Nav>();
  const { horses, remove } = useWishlist();

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft color={colors.foreground} size={20} />
        </Pressable>
        <Text style={styles.title}>Saved Horses</Text>
      </View>

      <FlatList
        data={horses}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Heart color={colors.mutedForeground} size={28} />
            <Text style={styles.emptyText}>No saved horses yet.</Text>
            <Text style={styles.emptySubtext}>
              Tap the heart icon on any horse to shortlist it here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('HorseDetail', { horseId: item._id })}>
            {item.photos?.[0] ? (
              <Image source={{ uri: getMediaUrl(item.photos[0]) }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]} />
            )}
            <View style={styles.cardBody}>
              <Text style={styles.breed}>{item.breed}</Text>
              <Text style={styles.category}>{item.category?.name}</Text>
              {item.location ? (
                <View style={styles.locationRow}>
                  <MapPin color={colors.mutedForeground} size={12} />
                  <Text style={styles.locationText}>{item.location}</Text>
                </View>
              ) : null}
              <Text style={styles.price}>₹{item.price.toLocaleString('en-IN')}</Text>
            </View>
            <Pressable
              style={styles.removeBtn}
              hitSlop={10}
              onPress={() => remove(item._id)}>
              <Heart color={colors.primary} size={18} fill={colors.primary} />
            </Pressable>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  list: {
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.sm,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: 6,
  },
  emptyText: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '600',
  },
  emptySubtext: {
    color: colors.mutedForeground,
    fontSize: 12,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    paddingRight: spacing.sm,
  },
  thumb: {
    width: 90,
    height: 90,
  },
  thumbPlaceholder: {
    backgroundColor: colors.muted,
  },
  cardBody: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'center',
    gap: 2,
  },
  breed: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
  },
  category: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
  removeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
