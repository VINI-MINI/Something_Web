import { getAdminDb } from "@/lib/firebase/admin";
import type { Couple, PartnerProfile } from "@/types/couple";
import type { UserProfile } from "@/types/user";

export async function getCouple(coupleId: string): Promise<Couple | null> {
  const db = getAdminDb();
  const snapshot = await db.collection("couples").doc(coupleId).get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data() as Couple;
}

export async function getPartnerProfile(
  currentUid: string,
  coupleId: string,
): Promise<PartnerProfile | null> {
  const couple = await getCouple(coupleId);
  if (!couple) {
    return null;
  }

  const partnerUid = couple.memberUids.find((uid) => uid !== currentUid);
  if (!partnerUid) {
    return null;
  }

  const db = getAdminDb();
  const partnerSnapshot = await db.collection("users").doc(partnerUid).get();
  if (!partnerSnapshot.exists) {
    return null;
  }

  const partnerData = partnerSnapshot.data() as UserProfile;
  return {
    uid: partnerUid,
    displayName: partnerData.displayName,
    photoURL: partnerData.photoURL,
  };
}
