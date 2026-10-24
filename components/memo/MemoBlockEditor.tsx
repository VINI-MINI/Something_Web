"use client";

import type { MarkdownBlock } from "@/types/markdown";

interface MemoBlockEditorProps {
  blocks: MarkdownBlock[];
  onChangeContent?: (newContent: string) => void;
  onBlur?: () => void;
}

/**
 * 블록 단위 비주얼 편집기 컴포넌트 (뼈대)
 * 다음 작업 단위에서 각 블록별 인라인 인풋 및 노션 스타일 백스페이스/엔터 인터랙션이 구현됩니다.
 */
export function MemoBlockEditor({
  blocks,
  onChangeContent,
  onBlur,
}: MemoBlockEditorProps) {
  return (
    <div className="flex flex-1 flex-col gap-1 py-2">
      <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          블록 단위 편집 모드 ({blocks.length}개 블록)
        </p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          다음 단계에서 블록별 인라인 편집 및 키보드 인터랙션이 연결됩니다.
        </p>
      </div>
    </div>
  );
}
