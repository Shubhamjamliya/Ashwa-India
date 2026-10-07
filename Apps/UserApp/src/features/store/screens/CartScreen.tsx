import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Minus, Plus, ShoppingBag, Tag, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { EmptyView } from '../../../components/StateViews';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getMediaUrl } from '../../../services/media';
import { useCart, type CartItem } from '../../../context/CartContext';
import { money } from '../../../utils/format';
import type { CartPreview } from '../types';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Cart'>;

// One block per seller: orders are split by seller, so each seller is checked out on its own.
function SellerGroup({
  sellerId,
  sellerName,
  lines,
  onCheckout,
}: {
  sellerId: string;
  sellerName: string;
  lines: CartItem[];
  onCheckout: (sellerId: string, coupon?: string) => void;
}) {
  const { updateQuantity, removeItem, unitPrice } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<string | null>(null);
  const [preview, setPreview] = useState<CartPreview | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const payload = useMemo(
    () => lines.map(l => ({ productId: l.product._id, variantId: l.variant?._id, quantity: l.quantity })),
    [lines],
  );

  useEffect(() => {
    setBusy(true);
    apiFetch<CartPreview>('/store/cart/preview', {
      method: 'POST',
      body: { items: payload, couponCode: coupon || undefined },
    })
      .then(p => {
        setPreview(p);
        setError('');
      })
      .catch(e => {
        // A bad coupon is dropped so the cart still checks out at full price.
        if (coupon) setCoupon(null);
        setPreview(null);
        setError(e.message || 'Could not price the cart');
      })
      .finally(() => setBusy(false));
  }, [payload, coupon]);

  const applyCoupon = () => {
    if (couponInput.trim()) setCoupon(couponInput.trim().toUpperCase());
  };

  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>SOLD BY {sellerName.toUpperCase()}</Text>
      {lines.map(item => (
        <View key={item.key} style={styles.line}>
          <View style={styles.lineImage}>
            {item.product.photos?.[0] ? (
              <Image source={{ uri: getMediaUrl(item.product.photos[0]) }} style={styles.fill} />
            ) : (
              <ShoppingBag color="#A3A3A3" size={20} />
            )}
          </View>
          <View style={styles.lineBody}>
            <View>
              <Text style={styles.lineName} numberOfLines={2}>
                {item.product.name}
              </Text>
              {item.variant ? <Text style={styles.lineVariant}>{item.variant.label}</Text> : null}
              <Text style={styles.linePrice}>{money(unitPrice(item))}</Text>
            </View>
            <View style={styles.lineFoot}>
              <View style={styles.stepper}>
                <Pressable style={styles.stepBtn} onPress={() => updateQuantity(item.key, item.quantity - 1)}>
                  <Minus color={colors.foreground} size={14} />
                </Pressable>
                <Text style={styles.qty}>{item.quantity}</Text>
                <Pressable style={styles.stepBtn} onPress={() => updateQuantity(item.key, item.quantity + 1)}>
                  <Plus color={colors.foreground} size={14} />
                </Pressable>
              </View>
              <Pressable onPress={() => removeItem(item.key)} hitSlop={8}>
                <Trash2 color={colors.destructive} size={18} />
              </Pressable>
            </View>
          </View>
        </View>
      ))}

      <View style={styles.summary}>
        <View style={styles.couponRow}>
          <View style={styles.couponBox}>
            <Tag color="#A3A3A3" size={16} />
            <TextInput
              value={couponInput}
              onChangeText={setCouponInput}
              autoCapitalize="characters"
              placeholder="Coupon code"
              placeholderTextColor={colors.mutedForeground}
              onSubmitEditing={applyCoupon}
              style={styles.couponInput}
            />
          </View>
          <Pressable style={styles.applyBtn} onPress={applyCoupon}>
            <Text style={styles.applyText}>Apply</Text>
          </Pressable>
        </View>
        {coupon && preview?.couponCode ? (
          <Text style={styles.applied}>
            {preview.couponCode} applied · you save {money(preview.discount)}{'  '}
            <Text
              style={styles.removeCoupon}
              onPress={() => {
                setCoupon(null);
                setCouponInput('');
              }}>
              remove
            </Text>
          </Text>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text style={styles.muted}>{money(preview?.subtotal)}</Text>
          </View>
          {preview && preview.discount > 0 ? (
            <View style={styles.totalRow}>
              <Text style={styles.discount}>Discount</Text>
              <Text style={styles.discount}>− {money(preview.discount)}</Text>
            </View>
          ) : null}
          {preview?.gst && preview.gst.amount > 0 ? (
            <View style={styles.totalRow}>
              <Text style={styles.body}>GST ({preview.gst.percent}%)</Text>
              <Text style={styles.body}>{money(preview.gst.amount)}</Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text style={styles.grand}>Total</Text>
            <Text style={styles.grand}>{busy ? '…' : money(preview?.total)}</Text>
          </View>
        </View>

        <Pressable
          style={[styles.checkoutBtn, (!preview || busy) && styles.disabled]}
          disabled={!preview || busy}
          onPress={() => onCheckout(sellerId, preview?.couponCode || undefined)}>
          <Text style={styles.checkoutText}>Checkout from {sellerName}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function CartScreen() {
  const navigation = useNavigation<Nav>();
  const { items } = useCart();

  const groups = useMemo(() => {
    const map = new Map<string, { sellerId: string; sellerName: string; lines: CartItem[] }>();
    for (const item of items) {
      const sellerId = item.product.seller?._id || 'unknown';
      if (!map.has(sellerId)) {
        map.set(sellerId, {
          sellerId,
          sellerName: item.product.seller?.businessName || item.product.seller?.name || 'Seller',
          lines: [],
        });
      }
      map.get(sellerId)!.lines.push(item);
    }
    return [...map.values()];
  }, [items]);

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title="Your Cart" />
      {items.length === 0 ? (
        <EmptyView
          icon={<ShoppingBag color="#A3A3A3" size={32} />}
          title="Your cart is empty"
          text="Browse the Accessories Store to add items."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {groups.map(g => (
            <SellerGroup
              key={g.sellerId}
              sellerId={g.sellerId}
              sellerName={g.sellerName}
              lines={g.lines}
              onCheckout={(sellerId, coupon) => navigation.navigate('Checkout', { sellerId, coupon })}
            />
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  fill: { width: '100%', height: '100%' },
  content: { gap: spacing.lg, padding: spacing.md, paddingBottom: spacing.xl },
  group: { gap: 10 },
  groupTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, color: colors.mutedForeground, paddingHorizontal: 4 },
  line: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  lineImage: { width: 90, height: 90, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  lineBody: { flex: 1, padding: 12, justifyContent: 'space-between' },
  lineName: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  lineVariant: { fontSize: 11, color: colors.mutedForeground },
  linePrice: { fontSize: 14, fontWeight: '800', color: colors.primary, marginTop: 2 },
  lineFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { minWidth: 18, textAlign: 'center', fontSize: 14, fontWeight: '700', color: colors.foreground },
  summary: {
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  couponRow: { flexDirection: 'row', gap: spacing.sm },
  couponBox: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  couponInput: { flex: 1, fontSize: 14, color: colors.foreground, paddingVertical: 0 },
  applyBtn: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  applyText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  applied: { fontSize: 12, fontWeight: '700', color: '#047857' },
  removeCoupon: { color: colors.mutedForeground, textDecorationLine: 'underline' },
  error: { fontSize: 12, color: colors.destructive },
  totals: { gap: 4, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  muted: { fontSize: 14, color: colors.mutedForeground },
  body: { fontSize: 14, color: colors.foreground },
  discount: { fontSize: 14, color: '#047857' },
  grand: { fontSize: 16, fontWeight: '800', color: colors.foreground },
  checkoutBtn: { borderRadius: radius.md, backgroundColor: colors.primary, paddingVertical: 12, alignItems: 'center' },
  checkoutText: { fontSize: 14, fontWeight: '700', color: colors.white },
  disabled: { opacity: 0.5 },
});
