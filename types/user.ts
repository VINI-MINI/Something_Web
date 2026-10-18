export enum AuthProvider {
  GOOGLE = "google",
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerId: AuthProvider;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  coupleId: string | null;
  createdAt: string;
  updatedAt: string;
}
