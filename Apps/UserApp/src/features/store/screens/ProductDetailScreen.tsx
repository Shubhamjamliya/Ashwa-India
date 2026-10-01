import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowLeft, Minus, Plus, ShoppingBag, ShoppingCart } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getMediaUrl } from '../../../services/media';
import { useCart } from '../../../context/CartContext';
import type { Product } from '../types';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'ProductDetail'>;
type Rt = RouteProp<HomeStackParamList, 'ProductDetail'>;

export function ProductDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { addItem, totalCount: cartCount } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    apiFetch<{ product: Product }>(`/store/products/${params.productId}`)
      .then(data => setProduct(data.product))
      .catch(e => setError(e.message || 'Failed to load product'))
      .finally(() => setLoading(false));
  }, [params.productId]);

  const inStock = (product?.stock ?? 0) > 0;

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1800);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem(product, quantity);
    navigation.navigate('Checkout', undefined);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft color={colors.foreground} size={20} />
        </Pressable>
        <Text style={styles.title}>Product Details</Text>
        <Pressable
          onPress={() => navigation.navigate('Cart', undefined)}
          hitSlop={12}
          style={styles.cartBtn}>
          <ShoppingCart color={colors.foreground} size={20} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error || !product ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || 'Product not found'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {product.photos?.[0] ? (
            <Image source={{ uri: getMediaUrl(product.photos[0]) }} style={styles.hero} />
          ) : (
            <View style={[styles.hero, styles.heroPlaceholder]}>
              <ShoppingBag color={colors.mutedForeground} size={32} />
            </View>
          )}

          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>₹{product.price.toLocaleString('en-IN')}</Text>

          <View style={styles.badgeRow}>
            <Text style={styles.category}>{product.category?.name}</Text>
            <Text style={inStock ? styles.inStock : styles.outOfStock}>
              {inStock ? `${product.stock} in stock` : 'Out of stock'}
            </Text>
          </View>

          {product.description ? <Text style={styles.description}>{product.description}</Text> : null}

          <View style={styles.sellerCard}>
            <Text style={styles.sellerLabel}>Sold by</Text>
            <Text style={styles.sellerName}>
              {product.seller?.businessName || product.seller?.name}
            </Text>
          </View>

          {inStock && (
            <View style={styles.buyCard}>
              <Text style={styles.buyTitle}>Quantity</Text>
              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => setQuantity(q => Math.max(1, q - 1))}>
                  <Minus color={colors.foreground} size={16} />
                </Pressable>
                <Text style={styles.stepValue}>{quantity}</Text>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => setQuantity(q => Math.min(product.stock, q + 1))}>
                  <Plus color={colors.foreground} size={16} />
                </Pressable>
              </View>

              {addedToCart ? <Text style={styles.addedText}>Added to cart!</Text> : null}

              <View style={styles.actionRow}>
                <Button
                  title="Add to Cart"
                  variant="outline"
                  onPress={handleAddToCart}
                  style={styles.actionBtn}
                />
                <Button
                  title={`Buy Now · ₹${(product.price * quantity).toLocaleString('en-IN')}`}
                  onPress={handleBuyNow}
                  style={styles.actionBtn}
                />
              </View>
            </View>
          )}
        </ScrollView>
      )}
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
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  cartBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: radius.full,
    backgroundColor: colors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  cartBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.white,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 14,
  },
  content: {
    padding: spacing.md,
    paddingTop: 0,
    paddingBottom: spacing.xl,
  },
  hero: {
    width: '100%',
    height: 220,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  heroPlaceholder: {
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  category: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  inStock: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  outOfStock: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.destructive,
  },
  description: {
    fontSize: 14,
    color: colors.foreground,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  sellerCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sellerLabel: {
    fontSize: 11,
    color: colors.mutedForeground,
    textTransform: 'uppercase',
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
    marginTop: 2,
  },
  buyCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  buyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
  },
  stepValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
    minWidth: 24,
    textAlign: 'center',
  },
  addedText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
  successCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.success,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
  },
  successText: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 4,
    textAlign: 'center',
  },
});
