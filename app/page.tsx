"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { LoginView } from "@/components/auth/LoginView";

export default function Home() {
  const { loading, signOut, user } = useAuth();

  if (loading) {
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

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-3 text-center">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName ?? "프로필"}
              className="h-16 w-16 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 text-xl font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
              {(user.displayName ?? user.email ?? "?")[0]}
            </div>
          )}
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {user.displayName ?? "이름 없음"}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {user.email}
            </p>
          </div>
        </div>

        <div className="w-full rounded-xl bg-zinc-50 p-4 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          <p className="mb-1 font-medium text-zinc-900 dark:text-zinc-100">
            계정 상태
          </p>
          <p>UID: {user.uid}</p>
          <p>
            커플 연결: {user.coupleId ? user.coupleId : "미연결 (대기 중)"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => signOut()}
          className="flex h-10 w-full items-center justify-center rounded-xl border border-zinc-300 bg-white text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          로그인 해제 (로그아웃)
        </button>
      </div>
    </main>
  );
}
