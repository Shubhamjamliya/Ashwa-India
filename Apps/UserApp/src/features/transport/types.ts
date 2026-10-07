export type TransportPoint = {
  address: string;
  lat: number;
  lng: number;
};

export type TransportType = 'private' | 'shared';

export type AvailableTransporter = {
  transporter: {
    id: string;
    name?: string;
    businessName?: string;
    phone: string;
    vehicleTypes?: string[];
    serviceType: TransportType | 'both';
  };
  distanceFromSourceKm: number;
  tripDistanceKm: number | null;
  quote?: { amount: number; pricePerKm: number; baseFare: number };
};

export type TransportRequestStatus = 'pending' | 'accepted' | 'completed' | 'rejected' | 'cancelled';

export type TransportStage = 'scheduled' | 'to_pickup' | 'in_transit' | 'delivered';

export type TransportRequest = {
  _id: string;
  user: { _id: string; name?: string; phone: string } | string;
  transporter: {
    _id: string;
    name?: string;
    businessName?: string;
    phone: string;
    vehicleTypes?: string[];
  };
  source: TransportPoint;
  destination: TransportPoint;
  type: TransportType;
  message?: string;
  status: TransportRequestStatus;
  stage?: TransportStage;
  pickupOtp?: string;
  dropOtp?: string;
  pickupVerifiedAt?: string;
  transporterLocation?: { lat: number; lng: number; updatedAt?: string };
  quote?: { amount: number };
  reviewed?: boolean;
  createdAt: string;
  respondedAt?: string;
};
