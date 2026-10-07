import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Banknote, CreditCard, MapPin, Plus, ShoppingBag, Wallet } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { EmptyView } from '../../../components/StateViews';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getMediaUrl } from '../../../services/media';
import { isPaymentCancelled, payForCart } from '../../../services/payments';
import { useCart } from '../../../context/CartContext';
import { useAddresses } from '../../../context/AddressContext';
import { useAuth } from '../../../context/AuthContext';
import { money } from '../../../utils/format';
import type { CartPreview } from '../types';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Checkout'>;
type Rt = RouteProp<HomeStackParamList, 'Checkout'>;
type Method = 'razorpay' | 'wallet' | 'cod';

function PayOption({
  active,
  onPress,
  icon: Icon,
  title,
  hint,
  disabled = false,
}: {
  active: boolean;
  onPress: () => void;
  icon: typeof Wallet;
  title: string;
  hint: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.payOption, active && styles.payOptionActive, disabled && styles.disabled]}>
      <View style={styles.iconCircle}>
        <Icon color={colors.primary} size={18} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.payTitle}>{title}</Text>
        <Text style={styles.payHint}>{hint}</Text>
      </View>
      <View style={[styles.radio, active && styles.radioOn]} />
    </Pressable>
  );
}

// Checks out one seller's lines from the cart (orders are split by seller).
export function CheckoutScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { sellerId, coupon: couponCode } = params;
  const { user } = useAuth();
  const { items, clearSeller } = useCart();
  const { selectedAddress } = useAddresses();

  const lines = useMemo(() => items.filter(i => i.product.seller?._id === sellerId), [items, sellerId]);
  const payload = useMemo(
    () => lines.map(l => ({ productId: l.product._id, variantId: l.variant?._id, quantity: l.quantity })),
    [lines],
  );

  const [preview, setPreview] = useState<CartPreview | null>(null);
  const [options, setOptions] = useState({ razorpay: true, cod: false });
  const [method, setMethod] = useState<Method>('razorpay');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{ razorpay: boolean; cod: boolean }>('/store/payment-options', { auth: false })
      .then(setOptions)
      .catch(() => {});
    apiFetch<{ wallet: { balance: number } }>('/payments/wallet')
      .then(d => setWalletBalance(Number(d.wallet?.balance) || 0))
      .catch(() => setWalletBalance(0));
  }, []);

  useEffect(() => {
    if (payload.length === 0) return;
    apiFetch<CartPreview>('/store/cart/preview', { method: 'POST', body: { items: payload, couponCode } })
      .then(setPreview)
      .catch(e => setError(e.message || 'Could not price your order'));
  }, [payload, couponCode]);

  const shippingAddress = selectedAddress
    ? {
        label: selectedAddress.label,
        line1: selectedAddress.line1,
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode,
        phone: user?.phone,
      }
    : null;

  const finish = (order: { _id: string }) => {
    navigation.replace('OrderDetail', { orderId: order._id });
    clearSeller(sellerId);
  };

  const placeOrder = async () => {
    if (!shippingAddress) {
      setError('Choose a delivery address');
      return;
    }
    setPlacing(true);
    setError('');
    try {
      if (method === 'wallet' || method === 'cod') {
        const data = await apiFetch<{ order: { _id: string } }>('/store/orders', {
          method: 'POST',
          body: { items: payload, couponCode, method, shippingAddress },
        });
        finish(data.order);
        return;
      }

      const { paymentIntentId, result } = await payForCart(payload, user, couponCode);
      const data = await apiFetch<{ order: { _id: string } }>('/store/orders', {
        method: 'POST',
        body: {
          items: payload,
          couponCode,
          method: 'razorpay',
          shippingAddress,
          paymentIntentId,
          razorpayPaymentId: result.razorpay_payment_id,
          razorpaySignature: result.razorpay_signature,
        },
      });
      finish(data.order);
    } catch (e: any) {
      setError(isPaymentCancelled(e) ? 'Payment was cancelled.' : e.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (lines.length === 0) {
    return (
      <Screen style={styles.noPadding} topColor={colors.navy}>
        <NavyHeader title="Checkout" />
        <EmptyView title="Nothing to check out. Go back to your cart." />
      </Screen>
    );
  }

  const sellerName = lines[0].product.seller?.businessName || lines[0].product.seller?.name || 'Seller';
  const total = preview?.total || 0;
  const walletEnough = walletBalance !== null && walletBalance >= total;

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title="Checkout" />

      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.sectionTitle}>DELIVERY ADDRESS</Text>
          {selectedAddress ? (
            <Pressable style={styles.addressCard} onPress={() => navigation.navigate('SelectAddress')}>
              <View style={styles.iconCircle}>
                <MapPin color={colors.primary} size={18} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
                <Text style={styles.addressText} numberOfLines={2}>
                  {[selectedAddress.line1, selectedAddress.city, selectedAddress.state, selectedAddress.pincode]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </View>
              <Text style={styles.change}>Change</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.addAddress} onPress={() => navigation.navigate('SelectAddress')}>
              <View style={styles.iconCircle}>
                <Plus color={colors.primary} size={18} />
              </View>
              <Text style={styles.addAddressText}>Add a delivery address</Text>
            </Pressable>
          )}
        </View>

        <View>
          <Text style={styles.sectionTitle}>PAYMENT</Text>
          <View style={styles.gap8}>
            {options.razorpay ? (
              <PayOption
                active={method === 'razorpay'}
                onPress={() => setMethod('razorpay')}
                icon={CreditCard}
                title="Pay online"
                hint="Cards, UPI, netbanking"
              />
            ) : null}
            {walletBalance !== null ? (
              <PayOption
                active={method === 'wallet'}
                onPress={() => walletEnough && setMethod('wallet')}
                disabled={!walletEnough}
                icon={Wallet}
                title="Ashwa wallet"
                hint={
                  walletEnough
                    ? `Balance ${money(walletBalance)}`
                    : `Balance ${money(walletBalance)} · not enough, add money in Wallet`
                }
              />
            ) : null}
            {options.cod ? (
              <PayOption
                active={method === 'cod'}
                onPress={() => setMethod('cod')}
                icon={Banknote}
                title="Cash on delivery"
                hint="Pay when your order arrives"
              />
            ) : null}
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>ORDER SUMMARY · {sellerName.toUpperCase()}</Text>
          <View style={styles.summary}>
            {lines.map(item => (
              <View key={item.key} style={styles.summaryRow}>
                <View style={styles.summaryImage}>
                  {item.product.photos?.[0] ? (
                    <Image source={{ uri: getMediaUrl(item.product.photos[0]) }} style={styles.fill} />
                  ) : (
                    <ShoppingBag color="#A3A3A3" size={16} />
                  )}
                </View>
                <View style={styles.flex}>
                  <Text style={styles.summaryName} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.summaryQty}>
                    {item.variant ? `${item.variant.label} · ` : ''}Qty {item.quantity}
                  </Text>
                </View>
              </View>
            ))}
            <View style={styles.totals}>
              <View style={styles.totalRow}>
                <Text style={styles.muted}>Subtotal</Text>
                <Text style={styles.muted}>{money(preview?.subtotal)}</Text>
              </View>
              {preview && preview.discount > 0 ? (
                <View style={styles.totalRow}>
                  <Text style={styles.discount}>Coupon {preview.couponCode}</Text>
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
                <Text style={styles.grand}>{money(preview?.total)}</Text>
              </View>
            </View>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.placeBtn, (!shippingAddress || !preview || placing) && styles.disabled]}
          disabled={!shippingAddress || !preview || placing}
          onPress={placeOrder}>
          <Text style={styles.placeText}>
            {placing
              ? 'Placing order...'
              : method === 'cod'
              ? `Place order · pay ${money(preview?.total)} on delivery`
              : `Pay ${money(preview?.total)} & place order`}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1, minWidth: 0 },
  fill: { width: '100%', height: '100%' },
  gap8: { gap: spacing.sm },
  content: { gap: 20, padding: spacing.md, paddingBottom: spacing.lg },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, color: colors.mutedForeground, marginBottom: spacing.sm },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  addressLabel: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  addressText: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  change: { fontSize: 12, fontWeight: '700', color: colors.primary, marginTop: 2 },
  addAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  addAddressText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  payOptionActive: { borderColor: colors.primary, backgroundColor: '#FBF6EC' },
  payTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  payHint: { fontSize: 12, color: colors.mutedForeground },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#D4D4D4' },
  radioOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  summary: {
    gap: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryImage: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryName: { fontSize: 13, fontWeight: '600', color: colors.foreground },
  summaryQty: { fontSize: 11, color: colors.mutedForeground },
  totals: { gap: 4, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  muted: { fontSize: 14, color: colors.mutedForeground },
  body: { fontSize: 14, color: colors.foreground },
  discount: { fontSize: 14, color: '#047857' },
  grand: { fontSize: 16, fontWeight: '800', color: colors.foreground },
  error: { fontSize: 13, color: colors.destructive },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card, padding: spacing.md },
  placeBtn: { borderRadius: radius.md, backgroundColor: colors.primary, paddingVertical: 12, alignItems: 'center' },
  placeText: { fontSize: 14, fontWeight: '700', color: colors.white },
  disabled: { opacity: 0.5 },
});
