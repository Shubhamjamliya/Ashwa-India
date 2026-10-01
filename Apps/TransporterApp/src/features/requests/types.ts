export type TransportPoint = {
  address: string;
  lat: number;
  lng: number;
};

export type TransportRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export type TransportRequest = {
  _id: string;
  user: { _id: string; name?: string; phone: string };
  transporter: string;
  source: TransportPoint;
  destination: TransportPoint;
  type: 'private' | 'shared';
  message?: string;
  status: TransportRequestStatus;
  createdAt: string;
  respondedAt?: string;
};
