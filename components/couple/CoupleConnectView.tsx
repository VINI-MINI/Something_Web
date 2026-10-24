"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useCouple } from "@/components/couple/CoupleProvider";

export function CoupleConnectView() {
  const searchParams = useSearchParams();
  const { acceptInvite, activeInvite, createInvite, loading } = useCouple();

  const [inputCode, setInputCode] = useState(
    () => searchParams.get("code")?.trim().toUpperCase() ?? "",
  );
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateCode = async () => {
    setErrorMessage(null);
    try {
      await createInvite();
    } catch (error) {
      console.error("Failed to create invite code:", error);
      setErrorMessage("초대 코드 생성에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  const handleCopyCode = async () => {
    if (!activeInvite) {
      return;
    }
    await navigator.clipboard.writeText(activeInvite.code);
    setCopyFeedback("코드가 복사되었습니다!");
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const handleCopyLink = async () => {
    if (!activeInvite) {
      return;
    }
    const link = `${window.location.origin}/?code=${activeInvite.code}`;
    await navigator.clipboard.writeText(link);
    setCopyFeedback("초대 링크가 복사되었습니다!");
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const handleAcceptCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await acceptInvite(inputCode.trim());
    } catch (error) {
      console.error("Failed to accept invite code:", error);
      const msg =
        error instanceof Error
          ? error.message
          : "커플 연결에 실패했습니다. 코드를 확인해 주세요.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const busy = loading || isSubmitting;

  return (
    <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          커플 연결하기
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          초대 코드를 공유하여 둘만의 메모 공간을 시작하세요.
        </p>
      </div>

      {errorMessage && (
        <p className="rounded-lg bg-red-50 p-2.5 text-center text-xs font-medium text-red-600 dark:bg-red-950/50 dark:text-red-400">
          {errorMessage}
        </p>
      )}

      {/* 내 초대 코드 섹션 */}
      <div className="flex flex-col gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          내 초대 코드
        </span>

        {activeInvite ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex w-full items-center justify-center rounded-lg bg-white py-3 text-2xl font-black tracking-widest text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-50">
              {activeInvite.code}
            </div>

            {copyFeedback && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {copyFeedback}
              </span>
            )}

            <div className="flex w-full gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex h-9 flex-1 items-center justify-center rounded-lg border border-zinc-300 bg-white text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                코드 복사
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex h-9 flex-1 items-center justify-center rounded-lg bg-zinc-900 text-xs font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                초대 링크 복사
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleCreateCode}
            disabled={busy}
            className="flex h-10 w-full items-center justify-center rounded-lg bg-zinc-900 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {busy ? "코드 생성 중..." : "초대 코드 발급받기"}
          </button>
        )}
      </div>

      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <span className="relative bg-white px-2 text-[11px] text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500">
          또는 상대방 코드 입력
        </span>
      </div>

      {/* 상대방 초대 코드 입력 섹션 */}
      <form onSubmit={handleAcceptCode} className="flex flex-col gap-3">
        <input
          type="text"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value.toUpperCase())}
          placeholder="6자리 초대 코드 입력"
          maxLength={6}
          disabled={busy}
          className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-center text-sm font-semibold tracking-wider text-zinc-900 placeholder:text-xs placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-100"
        />

        <button
          type="submit"
          disabled={busy || inputCode.trim().length !== 6}
          className="flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {busy ? "연결 중..." : "커플 연결하기"}
        </button>
      </form>
    </div>
  );
}
