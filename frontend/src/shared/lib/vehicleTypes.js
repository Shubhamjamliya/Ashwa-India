import { useEffect, useState } from "react"
import { apiFetch } from "./api"

// Admin-managed vehicle types ({ key, name, icon }). Fetched once per page load and shared by every caller.
let cache = null

export function loadVehicleTypes() {
  if (!cache) {
    cache = apiFetch("/vehicle-types", { auth: false })
      .then((d) => d.vehicleTypes || [])
      .catch((err) => {
        cache = null
        throw err
      })
  }
  return cache
}

export function useVehicleTypes() {
  const [types, setTypes] = useState([])
  useEffect(() => {
    let alive = true
    loadVehicleTypes()
      .then((t) => alive && setTypes(t))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])
  const labelOf = (key) => types.find((t) => t.key === key)?.name || key
  const iconOf = (key) => types.find((t) => t.key === key)?.icon || ""
  return { types, labelOf, iconOf }
}
