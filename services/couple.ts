import { getAdminDb } from "@/lib/firebase/admin";
import type { Couple, InviteCode, PartnerProfile } from "@/types/couple";
import type { UserProfile } from "@/types/user";

function generateRandomCode(length = 6): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createInviteCode(
  creatorUid: string,
): Promise<InviteCode> {
  const existingInvite = await getActiveInviteCode(creatorUid);
  if (existingInvite) {
    return existingInvite;
  }

  const db = getAdminDb();
  let code = generateRandomCode();
  let doc = await db.collection("invites").doc(code).get();

  while (doc.exists) {
    code = generateRandomCode();
    doc = await db.collection("invites").doc(code).get();
  }

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + 24 * 60 * 60 * 1000,
  ).toISOString();

  const invite: InviteCode = {
    code,
    creatorUid,
    createdAt: now.toISOString(),
    expiresAt,
  };

  await db.collection("invites").doc(code).set(invite);
  return invite;
}

export async function getActiveInviteCode(
  creatorUid: string,
): Promise<InviteCode | null> {
  const db = getAdminDb();
  const snapshot = await db
    .collection("invites")
    .where("creatorUid", "==", creatorUid)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const now = new Date().toISOString();
  for (const doc of snapshot.docs) {
    const invite = doc.data() as InviteCode;
    if (invite.expiresAt > now) {
      return invite;
    }
    void doc.ref.delete();
  }

  return null;
}

export async function acceptInviteCode(
  acceptorUid: string,
  code: string,
): Promise<{ couple: Couple; partner: PartnerProfile }> {
  const db = getAdminDb();
  const cleanCode = code.trim().toUpperCase();
  const inviteRef = db.collection("invites").doc(cleanCode);

  return db.runTransaction(async (transaction) => {
    const inviteSnapshot = await transaction.get(inviteRef);
    if (!inviteSnapshot.exists) {
      throw new Error("유효하지 않은 초대 코드입니다.");
    }

    const invite = inviteSnapshot.data() as InviteCode;
    const now = new Date().toISOString();
    if (now > invite.expiresAt) {
      throw new Error("만료된 초대 코드입니다.");
    }

    if (invite.creatorUid === acceptorUid) {
      throw new Error("자신의 초대 코드는 입력할 수 없습니다.");
    }

    const creatorRef = db.collection("users").doc(invite.creatorUid);
    const acceptorRef = db.collection("users").doc(acceptorUid);

    const [creatorSnapshot, acceptorSnapshot] = await Promise.all([
      transaction.get(creatorRef),
      transaction.get(acceptorRef),
    ]);

    if (!creatorSnapshot.exists || !acceptorSnapshot.exists) {
      throw new Error("사용자 정보를 찾을 수 없습니다.");
    }

    const creatorData = creatorSnapshot.data() as UserProfile;
    const acceptorData = acceptorSnapshot.data() as UserProfile;

    if (creatorData.coupleId || acceptorData.coupleId) {
      throw new Error("이미 다른 사용자와 연결되어 있습니다.");
    }

    const coupleRef = db.collection("couples").doc();
    const newCouple: Couple = {
      id: coupleRef.id,
      memberUids: [invite.creatorUid, acceptorUid],
      createdAt: now,
      updatedAt: now,
    };

    transaction.set(coupleRef, newCouple);
    transaction.update(creatorRef, { coupleId: coupleRef.id, updatedAt: now });
    transaction.update(acceptorRef, { coupleId: coupleRef.id, updatedAt: now });
    transaction.delete(inviteRef);

    const partner: PartnerProfile = {
      uid: creatorData.uid,
      displayName: creatorData.displayName,
      photoURL: creatorData.photoURL,
    };

    return { couple: newCouple, partner };
  });
}

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
