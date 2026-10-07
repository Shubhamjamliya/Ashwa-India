import React, { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Heart, Minus, Plus, ShoppingBag } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { CartIconButton, HeaderIconButton } from '../../../components/CartIconButton';
import { ErrorView, LoadingView } from '../../../components/StateViews';
import { StarPicker, Stars } from '../../../components/Stars';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getMediaUrl } from '../../../services/media';
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';
import { fmtDate, money } from '../../../utils/format';
import { stockText } from '../stock';
import type { Product, ProductReview } from '../types';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'ProductDetail'>;
type Rt = RouteProp<HomeStackParamList, 'ProductDetail'>;

function ReviewForm({ productId, onPosted }: { productId: string; onPosted: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      await apiFetch('/store/reviews', { method: 'POST', body: { productId, rating, comment: comment.trim() } });
      setRating(0);
      setComment('');
      onPosted();
    } catch (e: any) {
      setError(e.message || 'Could not save your review');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.reviewForm}>
      <Text style={styles.reviewFormTitle}>Rate this product (after delivery)</Text>
      <StarPicker value={rating} onChange={setRating} />
      {rating > 0 ? (
        <>
          <TextInput
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={500}
            placeholder="How did it work for you? (optional)"
            placeholderTextColor={colors.mutedForeground}
            style={styles.textarea}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={[styles.navyBtn, saving && styles.disabled]} disabled={saving} onPress={submit}>
            <Text style={styles.navyBtnText}>{saving ? 'Saving...' : 'Submit review'}</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

export function ProductDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const id = params.productId;
  const { addItem, totalCount: cartCount } = useCart();
  const { isSavedProduct, toggleProduct } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [addedNote, setAddedNote] = useState('');
  const [photo, setPhoto] = useState(0);

  const loadReviews = useCallback(
    () =>
      apiFetch<{ reviews: ProductReview[] }>(`/store/reviews?productId=${id}`, { auth: false })
        .then(d => setReviews(d.reviews || []))
        .catch(() => setReviews([])),
    [id],
  );

  useEffect(() => {
    setLoading(true);
    setError('');
    setVariantId(null);
    setQuantity(1);
    setPhoto(0);
    Promise.all([
      apiFetch<{ product: Product }>(`/store/products/${id}`, { auth: false }),
      apiFetch<{ products: Product[] }>(`/store/products/${id}/related`, { auth: false }),
    ])
      .then(([p, r]) => {
        setProduct(p.product);
        setRelated(r.products || []);
      })
      .catch(e => setError(e.message || 'Failed to load product'))
      .finally(() => setLoading(false));
    loadReviews();
  }, [id, loadReviews]);

  const cartButton = <CartIconButton count={cartCount} onPress={() => navigation.navigate('Cart')} />;

  if (loading || error || !product) {
    return (
      <Screen style={styles.noPadding} topColor={colors.navy}>
        <NavyHeader title="Product Details" />
        {loading ? <LoadingView /> : <ErrorView message={error || 'Product not found'} />}
      </Screen>
    );
  }

  const hasVariants = (product.variants?.length || 0) > 0;
  const variant = hasVariants ? product.variants!.find(v => v._id === variantId) || null : null;
  const stock = variant ? variant.stock : product.stock;
  const unitPrice = variant && variant.price != null ? variant.price : product.price;
  const status = stockText(stock);
  const canBuy = stock > 0 && (!hasVariants || Boolean(variant));
  const photos = product.photos || [];
  const saved = isSavedProduct(product._id);

  const addToCart = () => {
    addItem(product, quantity, variant);
    setAddedNote('Added to cart');
    setTimeout(() => setAddedNote(''), 1800);
  };

  const buyNow = () => {
    addItem(product, quantity, variant);
    navigation.navigate('Checkout', { sellerId: product.seller?._id });
  };

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader
        title="Product Details"
        right={
          <View style={styles.headerRight}>
            <HeaderIconButton onPress={() => toggleProduct(product)}>
              <Heart color={colors.primary} fill={saved ? colors.primary : 'transparent'} size={18} />
            </HeaderIconButton>
            {cartButton}
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.photo}>
          {photos[photo] ? (
            <Image source={{ uri: getMediaUrl(photos[photo]) }} style={styles.fill} />
          ) : (
            <ShoppingBag color="#A3A3A3" size={32} />
          )}
        </View>
        {photos.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
            {photos.map((url, i) => (
              <Pressable key={url + i} onPress={() => setPhoto(i)} style={[styles.thumb, i === photo && styles.thumbActive]}>
                <Image source={{ uri: getMediaUrl(url) }} style={styles.fill} />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View>
          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.ratingRow}>
            <Stars value={product.ratingAverage || 0} />
            <Text style={styles.muted}>
              {product.ratingCount
                ? `${(product.ratingAverage || 0).toFixed(1)} (${product.ratingCount} reviews)`
                : 'No reviews yet'}
            </Text>
          </View>
          <Text style={styles.price}>{money(unitPrice)}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.muted}>{product.category?.name}</Text>
            <Text style={[styles.stock, { color: status.color }]}>{status.text}</Text>
          </View>
        </View>

        {hasVariants ? (
          <View style={styles.gap8}>
            <Text style={styles.label}>Choose an option</Text>
            <View style={styles.variants}>
              {product.variants!.map(v => {
                const selected = v._id === variantId;
                const out = v.stock <= 0;
                return (
                  <Pressable
                    key={v._id}
                    disabled={out}
                    onPress={() => {
                      setVariantId(v._id);
                      setQuantity(1);
                    }}
                    style={[styles.variant, selected && styles.variantActive, out && styles.variantOut]}>
                    <Text style={[styles.variantText, selected && styles.variantTextActive, out && styles.strike]}>
                      {v.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {!variant ? <Text style={styles.muted}>Pick an option to see its price and stock.</Text> : null}
          </View>
        ) : null}

        {product.description ? <Text style={styles.description}>{product.description}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.cardKicker}>SOLD BY</Text>
          <Text style={styles.sellerName}>{product.seller?.businessName || product.seller?.name}</Text>
        </View>

        {canBuy ? (
          <View style={[styles.card, styles.gap12]}>
            <View style={styles.qtyRow}>
              <Text style={styles.label}>Quantity</Text>
              <View style={styles.stepper}>
                <Pressable style={styles.stepBtn} onPress={() => setQuantity(qty => Math.max(1, qty - 1))}>
                  <Minus color={colors.foreground} size={16} />
                </Pressable>
                <Text style={styles.qty}>{quantity}</Text>
                <Pressable style={styles.stepBtn} onPress={() => setQuantity(qty => Math.min(stock, qty + 1))}>
                  <Plus color={colors.foreground} size={16} />
                </Pressable>
              </View>
            </View>
            {addedNote ? <Text style={styles.added}>{addedNote}</Text> : null}
            <View style={styles.buyRow}>
              <Pressable style={[styles.buyBtn, styles.outlineBtn]} onPress={addToCart}>
                <Text style={styles.outlineText}>Add to cart</Text>
              </Pressable>
              <Pressable style={[styles.buyBtn, styles.goldBtn]} onPress={buyNow}>
                <Text style={styles.goldText} numberOfLines={1}>
                  Buy now · {money(unitPrice * quantity)}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={[styles.card, styles.gap12]}>
          <Text style={styles.cardTitle}>Reviews & ratings</Text>
          {reviews.length === 0 ? (
            <Text style={styles.muted}>No reviews yet.</Text>
          ) : (
            reviews.map((r, i) => (
              <View key={r._id} style={[styles.review, i < reviews.length - 1 && styles.reviewDivider]}>
                <View style={styles.reviewTop}>
                  <Text style={styles.reviewer}>{r.buyer?.name || 'Customer'}</Text>
                  <Stars value={r.rating} />
                </View>
                {r.comment ? <Text style={styles.reviewText}>{r.comment}</Text> : null}
                <Text style={styles.reviewDate}>{fmtDate(r.createdAt)}</Text>
              </View>
            ))
          )}
          <ReviewForm productId={product._id} onPosted={loadReviews} />
        </View>

        {related.length > 0 ? (
          <View>
            <Text style={[styles.cardTitle, styles.mb8]}>Related products</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.related}>
              {related.map(p => (
                <Pressable
                  key={p._id}
                  style={styles.relatedCard}
                  onPress={() => navigation.push('ProductDetail', { productId: p._id })}>
                  <View style={styles.relatedImage}>
                    {p.photos?.[0] ? (
                      <Image source={{ uri: getMediaUrl(p.photos[0]) }} style={styles.fill} />
                    ) : (
                      <ShoppingBag color="#A3A3A3" size={20} />
                    )}
                  </View>
                  <Text style={styles.relatedName} numberOfLines={2}>
                    {p.name}
                  </Text>
                  <Text style={styles.relatedPrice}>{money(p.price)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  fill: { width: '100%', height: '100%' },
  gap8: { gap: spacing.sm },
  gap12: { gap: 12 },
  mb8: { marginBottom: spacing.sm },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xl },
  photo: {
    height: 240,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbs: { gap: spacing.sm },
  thumb: { width: 56, height: 56, borderRadius: radius.sm, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  thumbActive: { borderColor: colors.primary },
  name: { fontSize: 20, fontWeight: '700', color: colors.foreground },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  muted: { fontSize: 12, color: colors.mutedForeground },
  price: { fontSize: 20, fontWeight: '800', color: colors.primary, marginTop: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  stock: { fontSize: 12, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '700', color: colors.foreground },
  variants: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  variant: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  variantActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  variantOut: { opacity: 0.4 },
  variantText: { fontSize: 12, fontWeight: '600', color: colors.foreground },
  variantTextActive: { color: colors.white },
  strike: { textDecorationLine: 'line-through' },
  description: { fontSize: 14, lineHeight: 20, color: colors.foreground },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  cardKicker: { fontSize: 11, letterSpacing: 0.4, color: colors.mutedForeground },
  sellerName: { fontSize: 15, fontWeight: '700', color: colors.foreground },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { minWidth: 24, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.foreground },
  added: { fontSize: 13, fontWeight: '600', color: '#059669' },
  buyRow: { flexDirection: 'row', gap: spacing.sm },
  buyBtn: { flex: 1, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center' },
  outlineBtn: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  outlineText: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  goldBtn: { backgroundColor: colors.primary },
  goldText: { fontSize: 14, fontWeight: '700', color: colors.white },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.foreground },
  review: { paddingBottom: 12 },
  reviewDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  reviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewer: { fontSize: 13, fontWeight: '700', color: colors.foreground },
  reviewText: { fontSize: 12, color: '#525252', marginTop: 4 },
  reviewDate: { fontSize: 10, color: '#A3A3A3', marginTop: 4 },
  reviewForm: { gap: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 12 },
  reviewFormTitle: { fontSize: 12, fontWeight: '700', color: colors.foreground },
  textarea: {
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.foreground,
    textAlignVertical: 'top',
  },
  error: { fontSize: 12, color: colors.destructive },
  navyBtn: { borderRadius: radius.md, backgroundColor: colors.navy, paddingVertical: 11, alignItems: 'center' },
  navyBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },
  disabled: { opacity: 0.5 },
  related: { gap: spacing.sm, paddingBottom: spacing.sm },
  relatedCard: {
    width: 140,
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingBottom: spacing.sm,
  },
  relatedImage: { height: 100, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  relatedName: { fontSize: 12, fontWeight: '700', color: colors.foreground, marginTop: spacing.sm, paddingHorizontal: spacing.sm },
  relatedPrice: { fontSize: 12, fontWeight: '800', color: colors.primary, marginTop: 2, paddingHorizontal: spacing.sm },
});
