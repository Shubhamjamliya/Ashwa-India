import { useEffect, useState } from 'react';
import { apiFetch } from './api';

// An admin-managed vehicle category. Vehicles store its `key`.
export type VehicleTypeOption = { key: string; name: string; icon?: string };

let cache: Promise<VehicleTypeOption[]> | null = null;

export function loadVehicleTypes() {
  if (!cache) {
    cache = apiFetch<{ vehicleTypes: VehicleTypeOption[] }>('/vehicle-types')
      .then(d => d.vehicleTypes || [])
      .catch(err => {
        cache = null;
        throw err;
      });
  }
  return cache;
}

export function useVehicleTypes() {
  const [types, setTypes] = useState<VehicleTypeOption[]>([]);
  useEffect(() => {
    let alive = true;
    loadVehicleTypes()
      .then(t => alive && setTypes(t))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const labelOf = (key: string) => types.find(t => t.key === key)?.name || key;
  const iconOf = (key: string) => types.find(t => t.key === key)?.icon || '';
  return { types, labelOf, iconOf };
}
