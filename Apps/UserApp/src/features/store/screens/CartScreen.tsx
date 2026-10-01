import React, { useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { colors, radius, spacing } from '../../../theme/colors';
import { getMediaUrl } from '../../../services/media';
import { useCart } from '../../../context/CartContext';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Cart'>;

export function CartScreen() {
  const navigation = useNavigation<Nav>();
  const { items, totalAmount, removeItem, updateQuantity } = useCart();

  const handleCheckout = () => {
    if (items.length === 0) return;
    navigation.navigate('Checkout', undefined);
  };

  return (
    <Screen style={styles.noPadding}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft color={colors.foreground} size={20} />
        </Pressable>
        <Text style={styles.title}>Your Cart</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.product._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <ShoppingBag color={colors.mutedForeground} size={32} />
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyText}>Browse the Accessories Store to add items.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.product.photos?.[0] ? (
              <Image source={{ uri: getMediaUrl(item.product.photos[0]) }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]}>
                <ShoppingBag color={colors.mutedForeground} size={20} />
              </View>
            )}
            <View style={styles.cardBody}>
              <Text style={styles.name} numberOfLines={2}>
                {item.product.name}
              </Text>
              <Text style={styles.price}>₹{item.product.price.toLocaleString('en-IN')}</Text>

              <View style={styles.rowBetween}>
                <View style={styles.stepper}>
                  <Pressable
                    style={styles.stepBtn}
                    onPress={() => updateQuantity(item.product._id, item.quantity - 1)}>
                    <Minus color={colors.foreground} size={14} />
                  </Pressable>
                  <Text style={styles.stepValue}>{item.quantity}</Text>
                  <Pressable
                    style={styles.stepBtn}
                    onPress={() => updateQuantity(item.product._id, item.quantity + 1)}>
                    <Plus color={colors.foreground} size={14} />
                  </Pressable>
                </View>
                <Pressable onPress={() => removeItem(item.product._id)} hitSlop={8}>
                  <Trash2 color={colors.destructive} size={18} />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />

      {items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{totalAmount.toLocaleString('en-IN')}</Text>
          </View>
          <Button title="Checkout" onPress={handleCheckout} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: {
    padding: 0,
  },
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: 8,
    marginTop: spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  image: {
    width: 90,
    height: 90,
  },
  imagePlaceholder: {
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
  },
  stepValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
    minWidth: 18,
    textAlign: 'center',
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    gap: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
});
