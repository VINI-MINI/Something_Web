"use client";

import Image from "next/image";
import { Suspense } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoginView } from "@/components/auth/LoginView";
import { CoupleConnectView } from "@/components/couple/CoupleConnectView";
import { useCouple } from "@/components/couple/CoupleProvider";

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
    <main className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            커플 연결 완료
          </span>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-1">
            우리만의 메모 공간
          </h2>
        </div>

        {/* 두 사람 프로필 카드 */}
        <div className="flex w-full items-center justify-around rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
          {/* 나 */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName ?? "나"}
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-200 text-lg font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                {(user.displayName ?? user.email ?? "?")[0]}
              </div>
            )}
            <span className="max-w-[80px] truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {user.displayName ?? "나"}
            </span>
          </div>

          <span className="text-2xl animate-pulse">❤️</span>

          {/* 상대방 */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            {partner?.photoURL ? (
              <Image
                src={partner.photoURL}
                alt={partner.displayName ?? "파트너"}
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-200 text-lg font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                {(partner?.displayName ?? "?")[0]}
              </div>
            )}
            <span className="max-w-[80px] truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {partner?.displayName ?? "상대방"}
            </span>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          다음 단계에서 함께 작성하는 실시간 공유 메모 기능이 추가될 예정입니다.
        </p>

        <button
          type="button"
          onClick={() => signOut()}
          className="flex h-10 w-full items-center justify-center rounded-xl border border-zinc-300 bg-white text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          로그아웃
        </button>
      </div>
    </main>
  );
}
