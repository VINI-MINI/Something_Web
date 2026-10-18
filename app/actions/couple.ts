"use server";

import { getAdminAuth } from "@/lib/firebase/admin";
import { getCouple, getPartnerProfile } from "@/services/couple";
import { getUserProfile } from "@/services/user";
import type { Couple, PartnerProfile } from "@/types/couple";

export async function getCoupleDataAction(
  idToken: string,
): Promise<{ couple: Couple | null; partner: PartnerProfile | null }> {
  const adminAuth = getAdminAuth();
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  const currentUid = decodedToken.uid;

  const userProfile = await getUserProfile(currentUid);
  if (!userProfile?.coupleId) {
    return { couple: null, partner: null };
  }

  const [couple, partner] = await Promise.all([
    getCouple(userProfile.coupleId),
    getPartnerProfile(currentUid, userProfile.coupleId),
  ]);

  return { couple, partner };
}
