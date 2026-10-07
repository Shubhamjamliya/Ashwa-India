import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Download, MapPin, Truck } from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { ErrorView, LoadingView } from '../../../components/StateViews';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getMediaUrl } from '../../../services/media';
import { openAuthorizedPdf } from '../../../services/files';
import { fmtDateTime, money } from '../../../utils/format';
import type { HomeStackParamList } from '../../../navigation/types';
import type { Order, OrderStatus } from '../../store/types';
import { ORDER_STATUS } from '../status';

type Rt = RouteProp<HomeStackParamList, 'OrderDetail'>;

const STEPS: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];

// Order detail: progress timeline, courier tracking, items, totals and the invoice.
export function OrderDetailScreen() {
  const { params } = useRoute<Rt>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    apiFetch<{ order: Order }>(`/store/orders/${params.orderId}`)
      .then(d => setOrder(d.order))
      .catch(e => setError(e.message || 'Could not load this order'));
  }, [params.orderId]);

  const downloadInvoice = async () => {
    if (!order) return;
    setDownloading(true);
    setError('');
    setNotice('');
    try {
      const { savedToDownloads } = await openAuthorizedPdf(
        `/store/orders/${order._id}/invoice`,
        `invoice-${order._id.slice(-6).toUpperCase()}.pdf`,
      );
      if (savedToDownloads) setNotice('Invoice saved to Downloads');
    } catch (e: any) {
      setError(e.message || 'Could not download the invoice');
    } finally {
      setDownloading(false);
    }
  };

  if (!order) {
    return (
      <Screen style={styles.noPadding} topColor={colors.navy}>
        <NavyHeader title="Order details" back="solid" />
        {error ? <ErrorView message={error} /> : <LoadingView />}
      </Screen>
    );
  }

  const meta = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
  const terminal = order.status === 'cancelled' || order.status === 'returned';
  const reached = (s: OrderStatus) => STEPS.indexOf(order.status) >= STEPS.indexOf(s);
  const ship = order.shippingAddress;
  const address = ship ? [ship.line1, ship.city, ship.state, ship.pincode].filter(Boolean).join(', ') : '';
  const lastEntry = (order.statusHistory || []).slice(-1)[0];

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title="Order details" back="solid" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, styles.headRow]}>
          <View>
            <Text style={styles.orderId}>Order #{order._id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.muted}>{order.seller?.businessName || order.seller?.name}</Text>
          </View>
          <Text style={[styles.pill, { backgroundColor: `${meta.color}20`, color: meta.color }]}>{meta.label}</Text>
        </View>

        {!terminal ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tracking</Text>
            {STEPS.map((s, i) => {
              const done = reached(s);
              const entry = (order.statusHistory || []).find(h => h.status === s);
              const lineDone = done && i < STEPS.length - 1 && reached(STEPS[i + 1]);
              return (
                <View key={s} style={styles.step}>
                  <View style={styles.stepRail}>
                    <View style={[styles.dot, done && styles.dotDone]} />
                    {i < STEPS.length - 1 ? <View style={[styles.line, lineDone && styles.dotDone]} /> : null}
                  </View>
                  <View style={styles.stepBody}>
                    <Text style={[styles.stepLabel, !done && styles.stepLabelPending]}>{ORDER_STATUS[s].label}</Text>
                    {entry ? <Text style={styles.muted}>{fmtDateTime(entry.at)}</Text> : null}
                  </View>
                </View>
              );
            })}
            {order.courier?.trackingNumber ? (
              <View style={styles.courier}>
                <Truck color={colors.primary} size={16} />
                <Text style={styles.body}>
                  {order.courier.name ? `${order.courier.name} · ` : ''}Tracking no.{' '}
                  <Text style={styles.bold}>{order.courier.trackingNumber}</Text>
                </Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.body}>This order was {order.status}.</Text>
            {lastEntry ? (
              <Text style={styles.muted}>
                {fmtDateTime(lastEntry.at)}
                {lastEntry.note ? ` · ${lastEntry.note}` : ''}
              </Text>
            ) : null}
          </View>
        )}

        <View style={[styles.card, styles.gap]}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.items.map((item, i) => {
            const product = typeof item.product === 'object' ? item.product : null;
            return (
              <View key={i} style={styles.itemRow}>
                <View style={styles.itemThumb}>
                  {product?.photos?.[0] ? (
                    <Image source={{ uri: getMediaUrl(product.photos[0]) }} style={styles.fill} />
                  ) : null}
                </View>
                <View style={styles.flex}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {product?.name || 'Item'}
                  </Text>
                  <Text style={styles.muted}>
                    {item.variantLabel ? `${item.variantLabel} · ` : ''}Qty {item.quantity}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>{money(item.price * item.quantity)}</Text>
              </View>
            );
          })}
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.muted}>Subtotal</Text>
              <Text style={styles.muted}>{money(order.subtotal ?? order.total + (order.discount || 0))}</Text>
            </View>
            {order.discount ? (
              <View style={styles.totalRow}>
                <Text style={styles.discount}>Coupon {order.couponCode}</Text>
                <Text style={styles.discount}>− {money(order.discount)}</Text>
              </View>
            ) : null}
            <View style={styles.totalRow}>
              <Text style={styles.grand}>Total</Text>
              <Text style={styles.grand}>{money(order.total)}</Text>
            </View>
            <Text style={styles.muted}>{order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Paid online'}</Text>
          </View>
        </View>

        {address ? (
          <View style={[styles.card, styles.addressRow]}>
            <MapPin color={colors.primary} size={16} />
            <Text style={[styles.body, styles.flex]}>
              {ship?.label ? `${ship.label}: ` : ''}
              {address}
            </Text>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        <Pressable
          style={[styles.invoiceBtn, downloading && styles.disabled]}
          disabled={downloading}
          onPress={downloadInvoice}>
          <Download color={colors.navy} size={16} />
          <Text style={styles.invoiceText}>{downloading ? 'Preparing invoice...' : 'Download invoice'}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1 },
  fill: { width: '100%', height: '100%' },
  gap: { gap: 12 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderId: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  muted: { fontSize: 11, color: colors.mutedForeground },
  pill: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  step: { flexDirection: 'row', gap: 12 },
  stepRail: { alignItems: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.border },
  dotDone: { backgroundColor: colors.primary },
  line: { width: 2, flex: 1, minHeight: 18, marginVertical: 4, backgroundColor: colors.border },
  stepBody: { paddingBottom: 12 },
  stepLabel: { fontSize: 13, fontWeight: '700', color: colors.foreground },
  stepLabelPending: { color: '#A3A3A3' },
  courier: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: 12,
  },
  body: { fontSize: 13, color: colors.foreground },
  bold: { fontWeight: '700' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemThumb: { width: 48, height: 48, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.muted },
  itemName: { fontSize: 13, fontWeight: '600', color: colors.foreground },
  itemPrice: { fontSize: 13, fontWeight: '700', color: colors.foreground },
  totals: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  discount: { fontSize: 13, color: '#047857' },
  grand: { fontSize: 16, fontWeight: '800', color: colors.foreground },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  error: { fontSize: 12, color: colors.destructive },
  notice: { fontSize: 12, fontWeight: '600', color: '#047857' },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.navy,
    backgroundColor: colors.card,
    paddingVertical: 12,
  },
  invoiceText: { fontSize: 14, fontWeight: '700', color: colors.navy },
  disabled: { opacity: 0.5 },
});
