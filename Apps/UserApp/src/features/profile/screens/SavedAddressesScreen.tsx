import React from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, MapPin, Pencil, Plus, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { colors, radius, spacing } from '../../../theme/colors';
import { useAddresses } from '../../../context/AddressContext';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'SavedAddresses'>;

export function SavedAddressesScreen() {
  const navigation = useNavigation<Nav>();
  const { addresses, removeAddress } = useAddresses();

  const confirmDelete = (id: string) => {
    Alert.alert('Delete address?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeAddress(id) },
    ]);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft color={colors.foreground} size={20} />
        </Pressable>
        <Text style={styles.title}>Saved Addresses</Text>
        <Pressable
          onPress={() => navigation.navigate('AddressForm', undefined)}
          hitSlop={12}
          style={styles.addBtn}>
          <Plus color={colors.white} size={18} />
        </Pressable>
      </View>

      <FlatList
        data={addresses}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <MapPin color={colors.mutedForeground} size={28} />
            <Text style={styles.emptyText}>No saved addresses yet.</Text>
            <Button
              title="Add Address"
              onPress={() => navigation.navigate('AddressForm', undefined)}
              style={styles.emptyBtn}
            />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardIconWrap}>
              <MapPin color={colors.primary} size={18} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardLabel}>{item.label}</Text>
              <Text style={styles.cardText}>
                {item.line1}, {item.city}, {item.state} {item.pincode}
              </Text>
            </View>
            <View style={styles.cardActions}>
              <Pressable
                hitSlop={8}
                onPress={() => navigation.navigate('AddressForm', { editId: item.id })}
                style={styles.actionBtn}>
                <Pencil color={colors.mutedForeground} size={16} />
              </Pressable>
              <Pressable hitSlop={8} onPress={() => confirmDelete(item.id)} style={styles.actionBtn}>
                <Trash2 color={colors.destructive} size={16} />
              </Pressable>
            </View>
          </View>
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
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
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
    gap: spacing.sm,
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: 14,
  },
  emptyBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  cardText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  cardActions: {
    gap: spacing.sm,
  },
  actionBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
