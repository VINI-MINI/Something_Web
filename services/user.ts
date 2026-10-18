import { getAdminDb } from "@/lib/firebase/admin";
import type { AuthUser, UserProfile } from "@/types/user";

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getAdminDb();
  const snapshot = await db.collection("users").doc(uid).get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data() as UserProfile;
}

export async function upsertUserProfile(user: AuthUser): Promise<UserProfile> {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(user.uid);
  const snapshot = await userRef.get();
  const now = new Date().toISOString();

  if (!snapshot.exists) {
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      coupleId: null,
      createdAt: now,
      updatedAt: now,
    };
    await userRef.set(newProfile);
    return newProfile;
  }

  const existingData = snapshot.data() as UserProfile;
  const updatedProfile: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    coupleId: existingData.coupleId ?? null,
    createdAt: existingData.createdAt,
    updatedAt: now,
  };

  await userRef.set(updatedProfile);
  return updatedProfile;
}
