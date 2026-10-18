import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { AuthProvider, type AuthUser } from "@/types/user";

export async function signIn(provider: AuthProvider): Promise<AuthUser> {
  switch (provider) {
    case AuthProvider.GOOGLE:
      return signInWithGoogle();
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(firebaseAuth);
}

export function subscribeAuthState(
  callback: (user: AuthUser | null) => void,
): () => void {
  return onAuthStateChanged(firebaseAuth, (user) => {
    callback(user ? toAuthUser(user) : null);
  });
}

export async function getIdToken(): Promise<string | null> {
  const currentUser = firebaseAuth.currentUser;
  if (!currentUser) {
    return null;
  }
  return currentUser.getIdToken();
}

function toAuthUser(
  user: FirebaseUser,
  explicitProvider?: AuthProvider,
): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    providerId: resolveAuthProvider(user, explicitProvider),
  };
}

function resolveAuthProvider(
  user: FirebaseUser,
  explicitProvider?: AuthProvider,
): AuthProvider {
  if (explicitProvider) {
    return explicitProvider;
  }

  const primaryProviderId = user.providerData[0]?.providerId;
  switch (primaryProviderId) {
    case GoogleAuthProvider.PROVIDER_ID:
      return AuthProvider.GOOGLE;
    default:
      return AuthProvider.GOOGLE;
  }
}

/**
 * Sign-in logics for each [AuthProvider]
 */
async function signInWithGoogle(): Promise<AuthUser> {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(firebaseAuth, provider);
  return toAuthUser(credential.user, AuthProvider.GOOGLE);
}