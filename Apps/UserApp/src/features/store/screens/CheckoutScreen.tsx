import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, MapPin, Plus, ShoppingBag } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getMediaUrl } from '../../../services/media';
import { payForCart } from '../../../services/payments';
import { useCart } from '../../../context/CartContext';
import { useAddresses } from '../../../context/AddressContext';
import { useAuth } from '../../../context/AuthContext';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Checkout'>;

export function CheckoutScreen() {
  const navigation = useNavigation<Nav>();
  const { items, totalAmount, clear } = useCart();
  const { selectedAddress } = useAddresses();
  const { user } = useAuth();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlaceOrder = async () => {
    if (items.length === 0 || !selectedAddress) return;
    setPlacing(true);
    setError(null);
    try {
      const payment = await payForCart(
        items.map(i => ({ productId: i.product._id, quantity: i.quantity })),
        user,
      );

      const bySeller = new Map<string, typeof items>();
      for (const item of items) {
        const sellerId = item.product.seller._id;
        if (!bySeller.has(sellerId)) bySeller.set(sellerId, []);
        bySeller.get(sellerId)!.push(item);
      }

      for (const sellerItems of bySeller.values()) {
        await apiFetch('/store/orders', {
          method: 'POST',
          body: {
            items: sellerItems.map(i => ({ productId: i.product._id, quantity: i.quantity })),
            shippingAddress: {
              label: selectedAddress.label,
              line1: selectedAddress.line1,
              city: selectedAddress.city,
              state: selectedAddress.state,
              pincode: selectedAddress.pincode,
              phone: user?.phone,
            },
            razorpayOrderId: payment.razorpay_order_id,
            razorpayPaymentId: payment.razorpay_payment_id,
            razorpaySignature: payment.razorpay_signature,
          },
        });
      }

      clear();
      navigation.navigate('HomeMain');
    } catch (e: any) {
      if (e?.code === 2 || e?.description) {
        setError('Payment was cancelled.');
      } else {
        setError(e.message || 'Failed to place order');
      }
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Screen style={styles.noPadding}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft color={colors.foreground} size={20} />
        </Pressable>
        <Text style={styles.title}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        {selectedAddress ? (
          <Pressable
            style={styles.addressCard}
            onPress={() => navigation.navigate('SelectAddress', undefined)}>
            <View style={styles.addressIconWrap}>
              <MapPin color={colors.primary} size={18} />
            </View>
            <View style={styles.addressBody}>
              <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
              <Text style={styles.addressText} numberOfLines={2}>
                {[selectedAddress.line1, selectedAddress.city, selectedAddress.state, selectedAddress.pincode]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
              {user?.phone ? <Text style={styles.addressText}>{user.phone}</Text> : null}
            </View>
            <Text style={styles.changeLink}>Change</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.addAddressCard}
            onPress={() => navigation.navigate('SelectAddress', undefined)}>
            <View style={styles.addressIconWrap}>
              <Plus color={colors.primary} size={18} />
            </View>
            <Text style={styles.addAddressText}>Add a delivery address</Text>
          </Pressable>
        )}

        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryCard}>
          {items.map(item => (
            <View key={item.product._id} style={styles.summaryRow}>
              {item.product.photos?.[0] ? (
                <Image source={{ uri: getMediaUrl(item.product.photos[0]) }} style={styles.summaryImage} />
              ) : (
                <View style={[styles.summaryImage, styles.summaryImagePlaceholder]}>
                  <ShoppingBag color={colors.mutedForeground} size={16} />
                </View>
              )}
              <View style={styles.summaryText}>
                <Text style={styles.summaryName} numberOfLines={2}>
                  {item.product.name}
                </Text>
                <Text style={styles.summaryQty}>Qty {item.quantity}</Text>
              </View>
              <Text style={styles.summaryPrice}>
                ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{totalAmount.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={placing ? 'Processing payment...' : `Pay ₹${totalAmount.toLocaleString('en-IN')} & Place Order`}
          onPress={handlePlaceOrder}
          loading={placing}
          disabled={!selectedAddress || items.length === 0}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
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
  content: {
    padding: spacing.md,
    paddingTop: 0,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  addAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    padding: spacing.md,
  },
  addAddressText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  addressIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressBody: {
    flex: 1,
    gap: 2,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  addressText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  changeLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summaryImage: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
  },
  summaryImagePlaceholder: {
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    flex: 1,
  },
  summaryName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
  },
  summaryQty: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  summaryPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.foreground,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
});
