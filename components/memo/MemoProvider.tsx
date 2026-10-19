"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createMemoAction,
  deleteMemoAction,
  getCoupleMemosAction,
  getMemoAction,
  updateMemoAction,
} from "@/app/actions/memo";
import { useAuth } from "@/components/auth/AuthProvider";
import { getIdToken } from "@/services/auth";
import type { CreateMemoInput, Memo, UpdateMemoInput } from "@/types/memo";

interface MemoContextValue {
  memos: Memo[];
  loading: boolean;
  createMemo: (input: CreateMemoInput) => Promise<Memo>;
  updateMemo: (memoId: string, input: UpdateMemoInput) => Promise<Memo>;
  deleteMemo: (memoId: string) => Promise<void>;
  getMemoById: (memoId: string) => Memo | undefined;
  fetchMemo: (memoId: string) => Promise<Memo | null>;
  refreshMemos: () => Promise<void>;
}

const MemoContext = createContext<MemoContextValue | null>(null);

function sortMemos(memos: Memo[]): Memo[] {
  return [...memos].sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function MemoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(false);
  const sessionIdRef = useRef(0);

  const loadMemos = useCallback(async () => {
    sessionIdRef.current += 1;
    const sessionId = sessionIdRef.current;

    if (!user?.coupleId) {
      setMemos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = await getIdToken();
      if (sessionId !== sessionIdRef.current) {
        return;
      }

      if (token) {
        const loadedMemos = await getCoupleMemosAction(token);
        if (sessionId !== sessionIdRef.current) {
          return;
        }
        setMemos(sortMemos(loadedMemos));
      } else {
        setMemos([]);
      }
    } catch (error) {
      if (sessionId !== sessionIdRef.current) {
        return;
      }
      console.error("Failed to load couple memos:", error);
      setMemos([]);
    } finally {
      if (sessionId === sessionIdRef.current) {
        setLoading(false);
      }
    }
  }, [user?.coupleId]);

  useEffect(() => {
    loadMemos();
  }, [loadMemos]);

  const createMemo = useCallback(
    async (input: CreateMemoInput): Promise<Memo> => {
      const token = await getIdToken();
      if (!token) {
        throw new Error("인증 세션이 만료되었습니다. 다시 로그인해 주세요.");
      }

      const newMemo = await createMemoAction(token, input);
      setMemos((prev) => sortMemos([newMemo, ...prev]));
      return newMemo;
    },
    [],
  );

  const updateMemo = useCallback(
    async (memoId: string, input: UpdateMemoInput): Promise<Memo> => {
      const token = await getIdToken();
      if (!token) {
        throw new Error("인증 세션이 만료되었습니다. 다시 로그인해 주세요.");
      }

      const updated = await updateMemoAction(token, memoId, input);
      setMemos((prev) =>
        sortMemos(prev.map((item) => (item.id === memoId ? updated : item))),
      );
      return updated;
    },
    [],
  );

  const deleteMemo = useCallback(async (memoId: string): Promise<void> => {
    const token = await getIdToken();
    if (!token) {
      throw new Error("인증 세션이 만료되었습니다. 다시 로그인해 주세요.");
    }

    await deleteMemoAction(token, memoId);
    setMemos((prev) => prev.filter((item) => item.id !== memoId));
  }, []);

  const getMemoById = useCallback(
    (memoId: string): Memo | undefined => {
      return memos.find((item) => item.id === memoId);
    },
    [memos],
  );

  const fetchMemo = useCallback(
    async (memoId: string): Promise<Memo | null> => {
      const token = await getIdToken();
      if (!token) {
        return null;
      }

      try {
        const memo = await getMemoAction(token, memoId);
        if (memo) {
          setMemos((prev) => {
            const exists = prev.some((item) => item.id === memoId);
            const next = exists
              ? prev.map((item) => (item.id === memoId ? memo : item))
              : [...prev, memo];
            return sortMemos(next);
          });
        }
        return memo;
      } catch (error) {
        console.error("Failed to fetch memo:", error);
        return null;
      }
    },
    [],
  );

  const refreshMemos = useCallback(async () => {
    await loadMemos();
  }, [loadMemos]);

  return (
    <MemoContext.Provider
      value={{
        createMemo,
        deleteMemo,
        fetchMemo,
        getMemoById,
        loading,
        memos,
        refreshMemos,
        updateMemo,
      }}
    >
      {children}
    </MemoContext.Provider>
  );
}

export function useMemoContext(): MemoContextValue {
  const context = useContext(MemoContext);
  if (!context) {
    throw new Error("useMemoContext must be used within a MemoProvider");
  }
  return context;
}
