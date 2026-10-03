import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { getCurrentPosition, reverseGeocode } from "@/shared/lib/geocoding"

const LocationContext = createContext(null)
const STORAGE_KEY = "ashwa_user_web_location"

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")
    } catch {
      return null
    }
  })
  const [status, setStatus] = useState("idle")
  const [error, setError] = useState("")

  useEffect(() => {
    if (location) localStorage.setItem(STORAGE_KEY, JSON.stringify(location))
    else localStorage.removeItem(STORAGE_KEY)
  }, [location])

  const useDeviceLocation = useCallback(async () => {
    setStatus("loading")
    setError("")
    try {
      const { lat, lng } = await getCurrentPosition()
      const place = await reverseGeocode(lat, lng)
      const label = place?.city ? `${place.city}${place.state ? `, ${place.state}` : ""}` : "Current Location"
      setLocation({ lat, lng, label, source: "device" })
      setStatus("ready")
      return true
    } catch (err) {
      setError(err.message)
      setStatus("error")
      return false
    }
  }, [])

  const setManualLocation = useCallback((loc) => {
    setLocation({ ...loc, source: "manual" })
    setStatus("ready")
    setError("")
  }, [])

  return (
    <LocationContext.Provider value={{ location, status, error, useDeviceLocation, setManualLocation }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocationContext() {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error("useLocationContext must be used within LocationProvider")
  return ctx
}
