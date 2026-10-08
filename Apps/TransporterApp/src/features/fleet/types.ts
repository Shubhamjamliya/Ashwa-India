export type VehicleType = 'horse-trailer' | 'horse-van' | 'covered-truck' | 'open-truck' | 'mini-truck' | 'other';

export type VehicleDocument = { url?: string; expiresAt?: string };

export type Vehicle = {
  _id: string;
  vehicleType: VehicleType;
  registrationNumber: string;
  capacityKg?: number;
  compartments?: number;
  maxAnimals: number;
  dedicated?: boolean;
  shared?: boolean;
  images?: string[];
  documents?: Partial<Record<'registrationCertificate' | 'insurance' | 'fitness', VehicleDocument>>;
  isAvailable?: boolean;
};

export type Driver = {
  _id: string;
  name: string;
  phone: string;
  licenseNumber?: string;
  licenseExpiresAt?: string;
  licenseImage?: string;
  idProofImage?: string;
  isAvailable?: boolean;
};

export const VEHICLE_TYPE_LABEL: Record<VehicleType, string> = {
  'horse-trailer': 'Horse trailer',
  'horse-van': 'Horse van',
  'covered-truck': 'Covered truck',
  'open-truck': 'Open truck',
  'mini-truck': 'Mini truck',
  other: 'Other',
};
