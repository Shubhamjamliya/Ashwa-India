export type TransportPoint = {
  address: string;
  lat: number;
  lng: number;
};

export type TransportType = 'private' | 'shared';

export type VehicleTypeInfo = { key: string; name: string; description?: string; icon?: string };

// One admin vehicle type with its fare for this trip, as a ride app lists them.
export type VehicleOption = {
  vehicleType: VehicleTypeInfo;
  quote: { amount: number; tripKm: number };
  advance: number;
  available: number;
  nearestKm: number | null;
};

// A shared ride: another customer's accepted booking on the same route and day.
export type AvailableTransporter = {
  transporter: {
    id: string;
    name?: string;
    businessName?: string;
    phone: string;
    vehicleTypes?: string[];
    serviceType: TransportType | 'both';
  };
  distanceFromSourceKm?: number;
  tripDistanceKm: number | null;
  quote?: { amount: number; pricePerKm: number; baseFare: number };
  advance?: number;
  vehicleType?: VehicleTypeInfo | null;
  hostRequestId?: string;
  // Shared: the journey the vehicle is already making.
  rideFrom?: string;
  rideTo?: string;
  scheduledDate?: string;
  bookedAnimals?: number;
  seatsLeft?: number;
  fullQuote?: { amount: number };
};

// Another customer asking to share one of this user's accepted rides.
export type ShareRequest = {
  _id: string;
  hostRequest: string;
  animals: number;
  source: TransportPoint;
  destination: TransportPoint;
  scheduledDate: string;
  currentAmount: number;
  newAmount: number | null;
};

export type TransportRequestStatus = 'pending' | 'accepted' | 'completed' | 'rejected' | 'cancelled';

export type TransportStage = 'scheduled' | 'to_pickup' | 'in_transit' | 'delivered';

export type TransportRequest = {
  _id: string;
  user: { _id: string; name?: string; phone: string } | string;
  // Empty while the request is still offered to nearby transporters.
  transporter?: {
    _id: string;
    name?: string;
    businessName?: string;
    phone: string;
    vehicleTypes?: string[];
  } | null;
  vehicleType?: string;
  vehicleTypeInfo?: VehicleTypeInfo | null;
  source: TransportPoint;
  destination: TransportPoint;
  type: TransportType;
  animals?: number;
  scheduledDate?: string;
  sharedGroup?: string;
  hostRequest?: { _id: string } | string | null;
  shareApproval?: 'pending' | 'approved' | 'declined';
  rejectReason?: string;
  advance?: { amount?: number; status?: 'none' | 'paid' | 'refunded' };
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
