export type TransportPoint = {
  address: string;
  lat: number;
  lng: number;
};

export type TransportRequestStatus = 'pending' | 'accepted' | 'completed' | 'rejected' | 'cancelled';

export type TripStage = 'scheduled' | 'to_pickup' | 'in_transit' | 'delivered';

export type SharedStop = {
  requestId: string;
  position: number;
  animals: number;
  isThis?: boolean;
  pickup: TransportPoint;
  drop: TransportPoint;
  picked?: boolean;
  delivered?: boolean;
  status: string;
};

export type TransportRequest = {
  _id: string;
  user?: { _id: string; name?: string; phone?: string };
  source: TransportPoint;
  destination: TransportPoint;
  type: 'private' | 'shared';
  message?: string;
  status: TransportRequestStatus;
  stage?: TripStage;
  paused?: boolean;
  quote?: { tripKm?: number; pricePerKm?: number; baseFare?: number; amount?: number };
  vehicle?: { _id: string } | string | null;
  driver?: { _id: string } | string | null;
  pickupScheduledAt?: string;
  deliveryProof?: { url?: string; note?: string };
  sharedRun?: { animalsTotal: number; stops: SharedStop[] };
  settlement?: { grossAmount?: number; commission?: number; netAmount?: number };
  createdAt: string;
  respondedAt?: string;
};
