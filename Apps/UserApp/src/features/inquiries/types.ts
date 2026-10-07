type Party = { _id: string; name?: string; businessName?: string; phone?: string };

export type InquiryMessage = {
  sender: 'user' | 'seller';
  kind?: 'text' | 'offer' | 'deal';
  text: string;
  amount?: number;
  createdAt: string;
};

export type Inquiry = {
  _id: string;
  horse?: { _id: string; name?: string; breed?: string; photos?: string[] };
  seller?: Party;
  buyer?: Party;
  status?: string;
  messages?: InquiryMessage[];
  quote?: { amount: number; by: 'user' | 'seller'; status: 'pending' | 'accepted' | 'declined' };
  agreedAmount?: number;
  lastMessageAt?: string;
  createdAt: string;
};

export type VisitStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export type Visit = {
  _id: string;
  horse?: { name?: string; breed?: string };
  seller?: Party;
  preferredAt: string;
  status: VisitStatus;
};
