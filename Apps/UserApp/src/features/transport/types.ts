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
};

export type TransportRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

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
  createdAt: string;
  respondedAt?: string;
};
