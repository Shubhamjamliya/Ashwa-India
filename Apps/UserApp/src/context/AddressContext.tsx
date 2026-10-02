import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ADDRESS_KEY = 'ashwa_user_addresses';
const SELECTED_KEY = 'ashwa_user_selected_address';

export type Address = {
  id: string;
  label: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
};

type AddressContextValue = {
  addresses: Address[];
  selectedAddressId: string | null;
  selectedAddress: Address | null;
  addAddress: (address: Omit<Address, 'id'>) => Address;
  updateAddress: (id: string, address: Omit<Address, 'id'>) => void;
  removeAddress: (id: string) => void;
  selectAddress: (id: string) => void;
};

const AddressContext = createContext<AddressContextValue | undefined>(undefined);

export function AddressProvider({ children }: { children: React.ReactNode }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(ADDRESS_KEY), AsyncStorage.getItem(SELECTED_KEY)])
      .then(([rawAddresses, rawSelected]) => {
        if (rawAddresses) setAddresses(JSON.parse(rawAddresses));
        if (rawSelected) setSelectedAddressId(rawSelected);
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(ADDRESS_KEY, JSON.stringify(addresses)).catch(() => {});
  }, [addresses, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (selectedAddressId) {
      AsyncStorage.setItem(SELECTED_KEY, selectedAddressId).catch(() => {});
    } else {
      AsyncStorage.removeItem(SELECTED_KEY).catch(() => {});
    }
  }, [selectedAddressId, hydrated]);

  const addAddress = useCallback((address: Omit<Address, 'id'>) => {
    const created: Address = { ...address, id: `${Date.now()}` };
    setAddresses(prev => [...prev, created]);
    return created;
  }, []);

  const updateAddress = useCallback((id: string, address: Omit<Address, 'id'>) => {
    setAddresses(prev => prev.map(a => (a.id === id ? { ...address, id } : a)));
  }, []);

  const removeAddress = useCallback((id: string) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
    setSelectedAddressId(prev => (prev === id ? null : prev));
  }, []);

  const selectAddress = useCallback((id: string) => {
    setSelectedAddressId(id);
  }, []);

  const selectedAddress = addresses.find(a => a.id === selectedAddressId) || null;

  return (
    <AddressContext.Provider
      value={{
        addresses,
        selectedAddressId,
        selectedAddress,
        addAddress,
        updateAddress,
        removeAddress,
        selectAddress,
      }}>
      {children}
    </AddressContext.Provider>
  );
}

export function useAddresses() {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error('useAddresses must be used within AddressProvider');
  return ctx;
}
