"use server";

import { getAdminAuth } from "@/lib/firebase/admin";
import {
  createMemo,
  deleteMemo,
  getCoupleMemos,
  getMemo,
  updateMemo,
} from "@/services/memo";
import type { CreateMemoInput, Memo, UpdateMemoInput } from "@/types/memo";

export async function getCoupleMemosAction(
    idToken: string,
): Promise<Memo[]> {
  const adminAuth = getAdminAuth();
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  return getCoupleMemos(decodedToken.uid);
}

export async function getMemoAction(
    idToken: string,
    memoId: string,
): Promise<Memo | null> {
  const adminAuth = getAdminAuth();
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  return getMemo(decodedToken.uid, memoId);
}

export async function createMemoAction(
  idToken: string,
  input: CreateMemoInput,
): Promise<Memo> {
  const adminAuth = getAdminAuth();
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  return createMemo(decodedToken.uid, input);
}

export async function updateMemoAction(
  idToken: string,
  memoId: string,
  input: UpdateMemoInput,
): Promise<Memo> {
  const adminAuth = getAdminAuth();
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  return updateMemo(decodedToken.uid, memoId, input);
}

export async function deleteMemoAction(
  idToken: string,
  memoId: string,
): Promise<void> {
  const adminAuth = getAdminAuth();
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  return deleteMemo(decodedToken.uid, memoId);
}
