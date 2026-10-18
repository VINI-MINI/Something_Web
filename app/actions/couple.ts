"use server";

import { getAdminAuth } from "@/lib/firebase/admin";
import {
  acceptInviteCode,
  createInviteCode,
  getActiveInviteCode,
  getCouple,
  getPartnerProfile,
} from "@/services/couple";
import { getUserProfile } from "@/services/user";
import type { Couple, InviteCode, PartnerProfile } from "@/types/couple";

export async function createInviteCodeAction(
  idToken: string,
): Promise<InviteCode> {
  const adminAuth = getAdminAuth();
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  return createInviteCode(decodedToken.uid);
}

export async function getActiveInviteCodeAction(
  idToken: string,
): Promise<InviteCode | null> {
  const adminAuth = getAdminAuth();
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  return getActiveInviteCode(decodedToken.uid);
}

export async function acceptInviteCodeAction(
  idToken: string,
  code: string,
): Promise<{ couple: Couple; partner: PartnerProfile }> {
  const adminAuth = getAdminAuth();
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  return acceptInviteCode(decodedToken.uid, code);
}

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
