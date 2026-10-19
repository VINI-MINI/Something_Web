"use client";

import Image from "next/image";
import { Suspense } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoginView } from "@/components/auth/LoginView";
import { CoupleConnectView } from "@/components/couple/CoupleConnectView";
import { useCouple } from "@/components/couple/CoupleProvider";
import { MemoListView } from "@/components/memo/MemoListView";

export default function Home() {
  const { loading: authLoading, signOut, user } = useAuth();
  const { couple, loading: coupleLoading, partner } = useCouple();

  if (authLoading) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-6">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          불러오는 중...
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-6">
        <LoginView />
      </main>
    );
  }

  if (!user.coupleId) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <Suspense
          fallback={
            <div className="flex w-full max-w-sm flex-col items-center justify-center p-8 text-sm text-zinc-500 dark:text-zinc-400">
              불러오는 중...
            </div>
          }
        >
          <CoupleConnectView />
        </Suspense>

        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{user.displayName ?? user.email} 계정으로 로그인됨</span>
          <span>•</span>
          <button
            type="button"
            onClick={() => signOut()}
            className="underline hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            로그아웃
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center mx-auto w-full max-w-2xl p-4 sm:p-6 gap-6">
      {/* 상단 커플 상태 & 프로필 바 */}
      <header className="flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          {/* 두 사람 작은 프로필 아바타 */}
          <div className="flex items-center -space-x-2">
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName ?? "나"}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full border-2 border-white object-cover dark:border-zinc-900"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-zinc-200 text-xs font-bold text-zinc-600 dark:border-zinc-900 dark:bg-zinc-700 dark:text-zinc-300">
                {(user.displayName ?? user.email ?? "?")[0]}
              </div>
            )}
            {partner?.photoURL ? (
              <Image
                src={partner.photoURL}
                alt={partner.displayName ?? "파트너"}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full border-2 border-white object-cover dark:border-zinc-900"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-zinc-200 text-xs font-bold text-zinc-600 dark:border-zinc-900 dark:bg-zinc-700 dark:text-zinc-300">
                {(partner?.displayName ?? "?")[0]}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {user.displayName ?? "나"} & {partner?.displayName ?? "상대방"}
            </span>
            <span className="text-[11px] text-zinc-400">
              함께 쓰는 메모 공간
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => signOut()}
          className="rounded-lg px-2.5 py-1 text-xs text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          로그아웃
        </button>
      </header>

      {/* 공유 메모 목록 뷰 */}
      <MemoListView />
    </main>
  );
}
