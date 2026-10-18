"use server";

import { getAdminAuth } from "@/lib/firebase/admin";
import { getUserProfile, upsertUserProfile } from "@/services/user";
import { AuthProvider, type AuthUser, type UserProfile } from "@/types/user";

function resolveProviderFromToken(signInProvider?: string): AuthProvider {
  switch (signInProvider) {
    case "google.com":
      return AuthProvider.GOOGLE;
    default:
      return AuthProvider.GOOGLE;
  }
}

export async function syncUserProfileAction(
  idToken: string,
): Promise<UserProfile> {
  const adminAuth = getAdminAuth();
  const decodedToken = await adminAuth.verifyIdToken(idToken);

  const authUser: AuthUser = {
    uid: decodedToken.uid,
    email: decodedToken.email ?? null,
    displayName: decodedToken.name ?? null,
    photoURL: decodedToken.picture ?? null,
    providerId: resolveProviderFromToken(
      decodedToken.firebase?.sign_in_provider,
    ),
  };

  return upsertUserProfile(authUser);
}

export async function getUserProfileAction(
  idToken: string,
): Promise<UserProfile | null> {
  const adminAuth = getAdminAuth();
  const decodedToken = await adminAuth.verifyIdToken(idToken);

  return getUserProfile(decodedToken.uid);
}
