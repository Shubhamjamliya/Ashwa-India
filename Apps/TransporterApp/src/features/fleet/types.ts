// The key of an admin-managed vehicle type (see services/vehicleTypes).
export type VehicleType = string;

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

