export interface Couple {
  id: string;
  memberUids: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InviteCode {
  code: string;
  creatorUid: string;
  createdAt: string;
  expiresAt: string;
}

export interface PartnerProfile {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}
