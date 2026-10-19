"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMemoContext } from "@/components/memo/MemoProvider";
import type { Memo } from "@/types/memo";

function formatMemoDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    if (isToday) {
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    const isThisYear = date.getFullYear() === now.getFullYear();
    if (isThisYear) {
      return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    }

    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
  } catch {
    return "";
  }
}

export function MemoListView() {
  const router = useRouter();
  const { createMemo, deleteMemo, loading, memos, updateMemo } =
    useMemoContext();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateMemo = async () => {
    if (isCreating) {
      return;
    }
    setIsCreating(true);
    try {
      const newMemo = await createMemo({ title: "" });
      router.push(`/memo/${newMemo.id}`);
    } catch (error) {
      console.error("Failed to create memo:", error);
      alert("새 메모를 생성하지 못했습니다. 다시 시도해 주세요.");
      setIsCreating(false);
    }
  };

  const handleTogglePin = async (e: React.MouseEvent, memo: Memo) => {
    e.stopPropagation();
    try {
      await updateMemo(memo.id, { isPinned: !memo.isPinned });
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  };

  const handleDeleteMemo = async (e: React.MouseEvent, memo: Memo) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `'${memo.title || "제목 없는 메모"}'를 삭제하시겠습니까?`,
    );
    if (!confirmed) {
      return;
    }
    try {
      await deleteMemo(memo.id);
    } catch (error) {
      console.error("Failed to delete memo:", error);
      alert("메모 삭제에 실패했습니다.");
    }
  };

  const pinnedMemos = memos.filter((m) => m.isPinned);
  const normalMemos = memos.filter((m) => !m.isPinned);

  const renderMemoCard = (memo: Memo) => {
    const previewContent = memo.content.trim()
      ? memo.content.slice(0, 100)
      : "내용 없음";

    return (
      <div
        key={memo.id}
        onClick={() => router.push(`/memo/${memo.id}`)}
        className="group relative flex cursor-pointer flex-col justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
      >
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-semibold text-zinc-900 dark:text-zinc-100">
              {memo.title || "제목 없는 메모"}
            </h3>
            <button
              type="button"
              onClick={(e) => handleTogglePin(e, memo)}
              title={memo.isPinned ? "고정 해제" : "상단 고정"}
              className={`text-sm transition ${
                memo.isPinned
                  ? "text-amber-500 hover:text-amber-600"
                  : "text-zinc-300 opacity-60 hover:text-zinc-500 hover:opacity-100 dark:text-zinc-600 dark:hover:text-zinc-400"
              }`}
            >
              📌
            </button>
          </div>
          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {previewContent}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-100 pt-2 text-[11px] text-zinc-400 dark:border-zinc-800/80 dark:text-zinc-500">
          <span>{formatMemoDate(memo.updatedAt)}</span>
          <button
            type="button"
            onClick={(e) => handleDeleteMemo(e, memo)}
            className="text-zinc-400 opacity-0 transition hover:text-rose-500 group-hover:opacity-100 dark:text-zinc-500 dark:hover:text-rose-400"
            title="메모 삭제"
          >
            삭제
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            공유 메모
          </h2>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {memos.length}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCreateMemo}
          disabled={isCreating}
          className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <span>✏️</span>
          <span>{isCreating ? "생성 중..." : "새 메모"}</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-xs text-zinc-400">
          메모 목록을 불러오는 중...
        </div>
      ) : memos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
          <span className="text-3xl">📝</span>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            아직 공유된 메모가 없어요
          </p>
          <p className="text-xs text-zinc-400">
            장보기 목록이나 함께 기억할 내용을 적어보세요.
          </p>
          <button
            type="button"
            onClick={handleCreateMemo}
            className="mt-2 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            첫 메모 작성하기
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {pinnedMemos.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                📌 고정된 메모
              </span>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {pinnedMemos.map(renderMemoCard)}
              </div>
            </div>
          )}

          {normalMemos.length > 0 && (
            <div className="flex flex-col gap-2">
              {pinnedMemos.length > 0 && (
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  모든 메모
                </span>
              )}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {normalMemos.map(renderMemoCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
