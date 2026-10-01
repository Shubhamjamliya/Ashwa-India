import { API_BASE_URL } from './config';
import { apiFetch } from './api';

const ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export type Branding = {
  companyName: string;
  logoUrl: string | null;
};

type LogoAsset = { url?: string } | null;
type BrandingResponse = {
  companyName: string;
  logo: LogoAsset;
  userLogo: LogoAsset;
};

function resolveUrl(url?: string | null): string | null {
  if (!url) return null;
  return /^https?:\/\//.test(url) ? url : `${ORIGIN}${url}`;
}

let cached: Branding | null = null;
let inFlight: Promise<Branding> | null = null;

export async function fetchBranding(): Promise<Branding> {
  if (cached) return cached;
  if (!inFlight) {
    inFlight = apiFetch<BrandingResponse>('/branding', { auth: false })
      .then(data => {
        cached = {
          companyName: data.companyName || 'Ashwa India',
          logoUrl: resolveUrl(data.userLogo?.url || data.logo?.url),
        };
        return cached;
      })
      .catch(() => ({ companyName: 'Ashwa India', logoUrl: null }))
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}
