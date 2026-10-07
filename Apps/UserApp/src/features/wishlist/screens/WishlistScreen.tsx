import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Heart, MapPin, ShoppingBag } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { EmptyView } from '../../../components/StateViews';
import { colors, radius, spacing } from '../../../theme/colors';
import { getMediaUrl } from '../../../services/media';
import { useWishlist } from '../../../context/WishlistContext';
import { priceLabel } from '../../marketplace/price';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Wishlist'>;

// Saved horses and saved accessories, both kept on the account.
export function WishlistScreen() {
  const navigation = useNavigation<Nav>();
  const { horses, products, toggle, toggleProduct } = useWishlist();
  const empty = horses.length === 0 && products.length === 0;

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title="Saved items" back="solid" titleSize={18} />

      {empty ? (
        <EmptyView
          icon={<Heart color="#A3A3A3" size={28} />}
          title="Nothing saved yet"
          text="Tap the heart on a horse or an accessory to save it here."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {horses.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>HORSES</Text>
              {horses.map(horse => (
                <View key={horse._id} style={styles.card}>
                  <Pressable
                    style={styles.cardMain}
                    onPress={() => navigation.navigate('HorseDetail', { horseId: horse._id })}>
                    <View style={styles.thumb}>
                      {horse.photos?.[0] ? <Image source={{ uri: getMediaUrl(horse.photos[0]) }} style={styles.fill} /> : null}
                    </View>
                    <View style={styles.body}>
                      <Text style={styles.title} numberOfLines={1}>
                        {horse.name || horse.breed}
                      </Text>
                      <Text style={styles.muted}>{horse.breed}</Text>
                      {horse.location ? (
                        <View style={styles.inline}>
                          <MapPin color={colors.mutedForeground} size={12} />
                          <Text style={styles.muted} numberOfLines={1}>
                            {horse.location}
                          </Text>
                        </View>
                      ) : null}
                      <Text style={styles.price}>{priceLabel(horse)}</Text>
                    </View>
                  </Pressable>
                  <Pressable style={styles.heart} hitSlop={8} onPress={() => toggle(horse)}>
                    <Heart color={colors.primary} fill={colors.primary} size={18} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          {products.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ACCESSORIES</Text>
              {products.map(product => (
                <View key={product._id} style={styles.card}>
                  <Pressable
                    style={styles.cardMain}
                    onPress={() => navigation.navigate('ProductDetail', { productId: product._id })}>
                    <View style={[styles.thumb, styles.center]}>
                      {product.photos?.[0] ? (
                        <Image source={{ uri: getMediaUrl(product.photos[0]) }} style={styles.fill} />
                      ) : (
                        <ShoppingBag color="#A3A3A3" size={20} />
                      )}
                    </View>
                    <View style={styles.body}>
                      <Text style={styles.productName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text style={styles.productPrice}>₹{product.price?.toLocaleString('en-IN')}</Text>
                    </View>
                  </Pressable>
                  <Pressable style={styles.heart} hitSlop={8} onPress={() => toggleProduct(product)}>
                    <Heart color={colors.primary} fill={colors.primary} size={18} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  fill: { width: '100%', height: '100%' },
  center: { alignItems: 'center', justifyContent: 'center' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  content: { gap: 20, padding: spacing.md, paddingBottom: spacing.xl },
  section: { gap: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, color: colors.mutedForeground },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingRight: spacing.sm,
  },
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 90, height: 90, backgroundColor: colors.muted },
  body: { flex: 1, minWidth: 0, gap: 2, padding: 12 },
  title: { fontSize: 15, fontWeight: '700', color: colors.foreground },
  muted: { flexShrink: 1, fontSize: 12, color: colors.mutedForeground },
  price: { fontSize: 15, fontWeight: '700', color: colors.primary, marginTop: 4 },
  productName: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  productPrice: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: 4 },
  heart: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
