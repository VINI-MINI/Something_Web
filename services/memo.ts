import { getAdminDb } from "@/lib/firebase/admin";
import { getUserProfile } from "@/services/user";
import type { CreateMemoInput, Memo, UpdateMemoInput } from "@/types/memo";

export async function getCoupleMemos(userUid: string): Promise<Memo[]> {
  const user = await getUserProfile(userUid);
  if (!user?.coupleId) {
    return [];
  }

  const db = getAdminDb();
  const snapshot = await db
      .collection("memos")
      .where("coupleId", "==", user.coupleId)
      .get();

  const memos = snapshot.docs.map((doc) => doc.data() as Memo);

  memos.sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  return memos;
}

export async function getMemo(
    userUid: string,
    memoId: string,
): Promise<Memo | null> {
  const user = await getUserProfile(userUid);
  if (!user?.coupleId) {
    return null;
  }

  const db = getAdminDb();
  const doc = await db.collection("memos").doc(memoId).get();

  if (!doc.exists) {
    return null;
  }

  const memo = doc.data() as Memo;
  if (memo.coupleId !== user.coupleId) {
    throw new Error("해당 메모에 접근할 수 있는 권한이 없습니다.");
  }

  return memo;
}

export async function createMemo(
  userUid: string,
  input: CreateMemoInput,
): Promise<Memo> {
  const user = await getUserProfile(userUid);
  if (!user?.coupleId) {
    throw new Error("커플로 연결된 사용자만 메모를 작성할 수 있습니다.");
  }

  const db = getAdminDb();
  const memoRef = db.collection("memos").doc();
  const now = new Date().toISOString();

  const memo: Memo = {
    id: memoRef.id,
    coupleId: user.coupleId,
    title: input.title.trim(),
    content: input.content ?? "",
    isPinned: false,
    createdBy: userUid,
    updatedBy: userUid,
    createdAt: now,
    updatedAt: now,
  };

  await memoRef.set(memo);
  return memo;
}

export async function updateMemo(
  userUid: string,
  memoId: string,
  input: UpdateMemoInput,
): Promise<Memo> {
  const user = await getUserProfile(userUid);
  if (!user?.coupleId) {
    throw new Error("커플로 연결된 사용자만 메모를 수정할 수 있습니다.");
  }

  const db = getAdminDb();
  const memoRef = db.collection("memos").doc(memoId);
  const doc = await memoRef.get();

  if (!doc.exists) {
    throw new Error("존재하지 않는 메모입니다.");
  }

  const memo = doc.data() as Memo;
  if (memo.coupleId !== user.coupleId) {
    throw new Error("해당 메모를 수정할 수 있는 권한이 없습니다.");
  }

  const now = new Date().toISOString();
  const updates: Partial<Memo> = {
    updatedBy: userUid,
    updatedAt: now,
  };

  if (input.title !== undefined) {
    updates.title = input.title.trim();
  }
  if (input.content !== undefined) {
    updates.content = input.content;
  }
  if (input.isPinned !== undefined) {
    updates.isPinned = input.isPinned;
  }

  await memoRef.update(updates);
  return {
    ...memo,
    ...updates,
  };
}

export async function deleteMemo(
  userUid: string,
  memoId: string,
): Promise<void> {
  const user = await getUserProfile(userUid);
  if (!user?.coupleId) {
    throw new Error("커플로 연결된 사용자만 메모를 삭제할 수 있습니다.");
  }

  const db = getAdminDb();
  const memoRef = db.collection("memos").doc(memoId);
  const doc = await memoRef.get();

  if (!doc.exists) {
    return;
  }

  const memo = doc.data() as Memo;
  if (memo.coupleId !== user.coupleId) {
    throw new Error("해당 메모를 삭제할 수 있는 권한이 없습니다.");
  }

  await memoRef.delete();
}
