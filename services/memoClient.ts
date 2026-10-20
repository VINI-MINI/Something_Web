import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { firestoreDb } from "@/lib/firebase/client";
import type { Memo } from "@/types/memo";

export function subscribeCoupleMemos(
  coupleId: string,
  onUpdate: (memos: Memo[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const memosRef = collection(firestoreDb, "memos");
  const q = query(memosRef, where("coupleId", "==", coupleId));

  return onSnapshot(
    q,
    (snapshot) => {
      const memos = snapshot.docs.map((docSnap) => docSnap.data() as Memo);
      onUpdate(memos);
    },
    (error) => {
      console.error("Firestore onSnapshot error (couple memos):", error);
      onError?.(error);
    },
  );
}

export function subscribeMemo(
  memoId: string,
  onUpdate: (memo: Memo | null) => void,
  onError?: (error: Error) => void,
): () => void {
  const memoRef = doc(firestoreDb, "memos", memoId);

  return onSnapshot(
    memoRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onUpdate(null);
        return;
      }
      onUpdate(snapshot.data() as Memo);
    },
    (error) => {
      console.error("Firestore onSnapshot error (memo):", error);
      onError?.(error);
    },
  );
}
