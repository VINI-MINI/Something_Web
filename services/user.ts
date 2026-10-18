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
  const now = new Date().toISOString();

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef);

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
      transaction.set(userRef, newProfile);
      return newProfile;
    }

    const existingData = snapshot.data() as UserProfile;
    transaction.update(userRef, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      updatedAt: now,
    });

    return {
      ...existingData,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      updatedAt: now,
    };
  });
}
