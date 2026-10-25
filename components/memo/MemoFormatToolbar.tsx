"use client";

import { useVirtualKeyboard } from "@/hooks/useVirtualKeyboard";
import type { FormatType } from "@/services/markdownFormat";

interface MemoFormatToolbarProps {
  activeType?: FormatType | null;
  headingLevel?: number;
  onTransform: (targetType: FormatType) => void;
}

/**
 * 공통 서식 툴바 (블록 편집기 및 마크다운 편집기 공용)
 * - VisualViewport 기반 가상 키보드 높이 자동 감지 및 bottom 위치 연동
 * - 포커스 유지를 위해 onMouseDown preventDefault 처리
 */
export function MemoFormatToolbar({
  activeType,
  headingLevel,
  onTransform,
}: MemoFormatToolbarProps) {
  const { keyboardHeight, isKeyboardOpen } = useVirtualKeyboard();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-20 flex justify-center px-4 transition-[bottom] duration-150 ease-out"
      style={{
        bottom: isKeyboardOpen
          ? `${keyboardHeight + 12}px`
          : "max(1rem, env(safe-area-inset-bottom, 1rem))",
      }}
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-zinc-200/90 bg-white/95 p-1.5 shadow-lg backdrop-blur-md dark:border-zinc-800/90 dark:bg-zinc-900/95">
        {/* 체크박스 */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onTransform("checkbox")}
          title="체크리스트로 변환"
          className={`flex h-8 items-center gap-1 rounded-xl px-2.5 text-xs font-medium transition ${
            activeType === "checkbox"
              ? "bg-emerald-600 text-white dark:bg-emerald-500"
              : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
        >
          <span>✓</span>
          <span>체크</span>
        </button>

        {/* 제목 (H1/H2/H3 순환) */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onTransform("heading")}
          title="제목으로 변환 (H1/H2/H3)"
          className={`flex h-8 items-center gap-1 rounded-xl px-2.5 text-xs font-medium transition ${
            activeType === "heading"
              ? "bg-zinc-900 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
        >
          <span>{activeType === "heading" ? `H${headingLevel || 1}` : "H"}</span>
          <span>제목</span>
        </button>

        {/* 불릿 목록 */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onTransform("bulletList")}
          title="글머리 기호 목록으로 변환"
          className={`flex h-8 items-center gap-1 rounded-xl px-2.5 text-xs font-medium transition ${
            activeType === "bulletList"
              ? "bg-zinc-900 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
        >
          <span>•</span>
          <span>목록</span>
        </button>

        {/* 번호 목록 */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onTransform("numberedList")}
          title="번호 매기기 목록으로 변환"
          className={`flex h-8 items-center gap-1 rounded-xl px-2.5 text-xs font-medium transition ${
            activeType === "numberedList"
              ? "bg-zinc-900 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
        >
          <span>1.</span>
          <span>번호</span>
        </button>

        {/* 일반 본문 */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onTransform("text")}
          title="일반 본문으로 변환"
          className={`flex h-8 items-center gap-1 rounded-xl px-2.5 text-xs font-medium transition ${
            activeType === "text"
              ? "bg-zinc-900 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
        >
          <span>T</span>
          <span>본문</span>
        </button>

        {/* 구분선 삽입 */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onTransform("divider")}
          title="구분선 삽입"
          className="flex h-8 items-center gap-1 rounded-xl px-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <span>―</span>
        </button>
      </div>
    </div>
  );
}
