"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMemoContext } from "@/components/memo/MemoProvider";

interface MemoEditorViewProps {
  memoId: string;
}

type SaveStatus = "saved" | "saving" | "unsaved" | "error";

export function MemoEditorView({ memoId }: MemoEditorViewProps) {
  const router = useRouter();
  const { deleteMemo, fetchMemo, getMemoById, updateMemo } = useMemoContext();

  const [initialLoaded, setInitialLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadedMemoIdRef = useRef<string | null>(null);
  const saveRevisionRef = useRef(0);
  const lastSavedRef = useRef<{ title: string; content: string }>({
    title: "",
    content: "",
  });

  useEffect(() => {
    // memoId가 바뀌지 않았고 이미 하이드레이션되었다면 재로드를 방지하여 작성 중인 상태를 보존
    if (loadedMemoIdRef.current === memoId) {
      return;
    }

    let isCancelled = false;

    async function loadData() {
      const cached = getMemoById(memoId);
      if (cached) {
        setTitle(cached.title);
        setContent(cached.content);
        setIsPinned(cached.isPinned);
        lastSavedRef.current = {
          title: cached.title,
          content: cached.content,
        };
        loadedMemoIdRef.current = memoId;
        setInitialLoaded(true);
        return;
      }

      const fetched = await fetchMemo(memoId);
      if (isCancelled) {
        return;
      }

      if (fetched) {
        setTitle(fetched.title);
        setContent(fetched.content);
        setIsPinned(fetched.isPinned);
        lastSavedRef.current = {
          title: fetched.title,
          content: fetched.content,
        };
      }
      loadedMemoIdRef.current = memoId;
      setInitialLoaded(true);
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [fetchMemo, getMemoById, memoId]);

  const saveChanges = useCallback(
    async (newTitle: string, newContent: string) => {
      if (
        newTitle === lastSavedRef.current.title &&
        newContent === lastSavedRef.current.content
      ) {
        setSaveStatus("saved");
        return;
      }

      saveRevisionRef.current += 1;
      const currentRevision = saveRevisionRef.current;

      setSaveStatus("saving");
      setErrorMessage(null);
      try {
        await updateMemo(memoId, {
          title: newTitle,
          content: newContent,
        });

        if (currentRevision !== saveRevisionRef.current) {
          return;
        }

        lastSavedRef.current = { title: newTitle, content: newContent };
        setSaveStatus("saved");
      } catch (error) {
        if (currentRevision !== saveRevisionRef.current) {
          return;
        }
        console.error("Failed to save memo:", error);
        setSaveStatus("error");
        setErrorMessage("저장에 실패했습니다. 다시 시도해 주세요.");
      }
    },
    [memoId, updateMemo],
  );

  const triggerDebouncedSave = useCallback(
    (newTitle: string, newContent: string) => {
      setSaveStatus("unsaved");
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        saveChanges(newTitle, newContent);
      }, 800);
    },
    [saveChanges],
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    triggerDebouncedSave(val, content);
  };

  const handleContentChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const val = e.target.value;
    setContent(val);
    triggerDebouncedSave(title, val);
  };

  const handleManualSave = async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    await saveChanges(title, content);
  };

  const handleBlur = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    saveChanges(title, content);
  };

  const handleTogglePin = async () => {
    const nextPinned = !isPinned;
    setIsPinned(nextPinned);
    try {
      await updateMemo(memoId, { isPinned: nextPinned });
    } catch (error) {
      console.error("Failed to toggle pin:", error);
      setIsPinned(!nextPinned);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("이 메모를 삭제하시겠습니까?");
    if (!confirmed) {
      return;
    }
    try {
      await deleteMemo(memoId);
      router.push("/");
    } catch (error) {
      console.error("Failed to delete memo:", error);
      alert("메모 삭제에 실패했습니다.");
    }
  };

  if (!initialLoaded) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-6">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          메모를 불러오는 중...
        </p>
      </main>
    );
  }

  const memoExists = Boolean(getMemoById(memoId));
  if (!memoExists && initialLoaded) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          메모를 찾을 수 없거나 접근 권한이 없습니다.
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          홈으로 돌아가기
        </button>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col mx-auto w-full max-w-2xl p-4 sm:p-6">
      {/* 상단 툴바 */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <span>←</span>
          <span>목록</span>
        </button>

        <div className="flex items-center gap-2">
          {/* 동기화 상태 표시 */}
          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === "saving" && (
              <span className="text-zinc-400">저장 중...</span>
            )}
            {saveStatus === "unsaved" && (
              <span className="text-amber-500 font-medium">수정됨 •</span>
            )}
            {saveStatus === "saved" && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                저장됨 ✓
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-rose-500 font-medium">저장 실패</span>
            )}
          </div>

          {/* 수동 동기화(저장) 버튼 */}
          <button
            type="button"
            onClick={handleManualSave}
            disabled={saveStatus === "saving"}
            className="flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <span>💾</span>
            <span>저장</span>
          </button>

          {/* 상단 고정 토글 버튼 */}
          <button
            type="button"
            onClick={handleTogglePin}
            title={isPinned ? "고정 해제" : "상단 고정"}
            className={`rounded-lg p-1.5 text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
              isPinned ? "text-amber-500" : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            📌
          </button>

          {/* 삭제 버튼 */}
          <button
            type="button"
            onClick={handleDelete}
            title="메모 삭제"
            className="rounded-lg p-1.5 text-sm text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
          >
            🗑️
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
          {errorMessage}
        </div>
      )}

      {/* 에디터 폼 */}
      <div className="mt-4 flex flex-1 flex-col gap-3">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          onBlur={handleBlur}
          placeholder="제목을 입력하세요"
          className="w-full bg-transparent text-xl font-bold tracking-tight text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-50 dark:placeholder:text-zinc-600"
        />

        <textarea
          value={content}
          onChange={handleContentChange}
          onBlur={handleBlur}
          placeholder="자유롭게 메모를 적어보세요..."
          className="min-h-[60vh] w-full flex-1 resize-none bg-transparent text-sm leading-relaxed text-zinc-800 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
        />
      </div>
    </main>
  );
}
