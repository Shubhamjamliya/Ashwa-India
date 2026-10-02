import { apiFetch } from './api';

export type ZoneCheckResult = {
  inZone: boolean;
  zone: { id: string; name: string } | null;
};

export async function checkZone(lat: number, lng: number): Promise<ZoneCheckResult> {
  return apiFetch<ZoneCheckResult>(`/zones/check?lat=${lat}&lng=${lng}`, { auth: false });
}
