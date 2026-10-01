import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View, FlatList } from 'react-native';
import { ChevronDown, Search, X } from 'lucide-react-native';
import { colors, radius, spacing } from '../../../theme/colors';
import type { HorseCategory } from '../../marketplace/types';

type Props = {
  categories: HorseCategory[];
  onSearch: (filters: { categoryId?: string; location?: string }) => void;
};

export function SearchFilterCard({ categories, onSearch }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<HorseCategory | null>(null);
  const [location, setLocation] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>I'm looking for</Text>
      <View style={styles.fixedField}>
        <Text style={styles.fixedFieldText}>Horses</Text>
      </View>

      <Text style={styles.label}>Category</Text>
      <Pressable style={styles.field} onPress={() => setModalVisible(true)}>
        <Text style={styles.fieldText} numberOfLines={1}>
          {selectedCategory?.name || 'All Categories'}
        </Text>
        <ChevronDown color={colors.mutedForeground} size={16} />
      </Pressable>

      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        placeholder="Any location"
        placeholderTextColor={colors.mutedForeground}
        value={location}
        onChangeText={setLocation}
      />

      <Pressable
        style={styles.searchBtn}
        onPress={() => onSearch({ categoryId: selectedCategory?._id, location: location.trim() || undefined })}>
        <Search color={colors.white} size={17} />
        <Text style={styles.searchBtnText}>Search</Text>
      </Pressable>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <X color={colors.foreground} size={20} />
              </Pressable>
            </View>
            <FlatList
              data={[{ _id: '', name: 'All Categories', slug: '' }, ...categories]}
              keyExtractor={item => item._id || 'all'}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedCategory(item._id ? item : null);
                    setModalVisible(false);
                  }}>
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.mutedForeground,
    marginBottom: 4,
    marginTop: spacing.sm,
  },
  fixedField: {
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  fixedFieldText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  fieldText: {
    flex: 1,
    fontSize: 14,
    color: colors.foreground,
  },
  input: {
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    fontSize: 14,
    color: colors.foreground,
  },
  searchBtn: {
    marginTop: spacing.md,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  searchBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '60%',
    paddingBottom: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
  },
  modalItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemText: {
    fontSize: 14,
    color: colors.foreground,
  },
});
