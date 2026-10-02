import { createContext, useCallback, useContext, useEffect, useState } from "react"

const ADDRESS_KEY = "ashwa_user_web_addresses"
const SELECTED_KEY = "ashwa_user_web_selected_address"

const AddressContext = createContext(null)

export function AddressProvider({ children }) {
  const [addresses, setAddresses] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(ADDRESS_KEY) || "[]")
    } catch {
      return []
    }
  })
  const [selectedAddressId, setSelectedAddressId] = useState(() => localStorage.getItem(SELECTED_KEY) || null)

  useEffect(() => {
    localStorage.setItem(ADDRESS_KEY, JSON.stringify(addresses))
  }, [addresses])

  useEffect(() => {
    if (selectedAddressId) localStorage.setItem(SELECTED_KEY, selectedAddressId)
    else localStorage.removeItem(SELECTED_KEY)
  }, [selectedAddressId])

  const addAddress = useCallback((address) => {
    const created = { ...address, id: `${Date.now()}` }
    setAddresses((prev) => [...prev, created])
    return created
  }, [])

  const updateAddress = useCallback((id, address) => {
    setAddresses((prev) => prev.map((a) => (a.id === id ? { ...address, id } : a)))
  }, [])

  const removeAddress = useCallback((id) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id))
    setSelectedAddressId((prev) => (prev === id ? null : prev))
  }, [])

  const selectAddress = useCallback((id) => setSelectedAddressId(id), [])

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || null

  return (
    <AddressContext.Provider
      value={{ addresses, selectedAddressId, selectedAddress, addAddress, updateAddress, removeAddress, selectAddress }}
    >
      {children}
    </AddressContext.Provider>
  )
}

export function useAddresses() {
  const ctx = useContext(AddressContext)
  if (!ctx) throw new Error("useAddresses must be used within AddressProvider")
  return ctx
}
