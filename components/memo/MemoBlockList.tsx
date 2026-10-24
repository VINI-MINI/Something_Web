"use client";

import { InlineMarkdownText } from "@/components/memo/InlineMarkdownText";
import type { MarkdownBlock } from "@/types/markdown";

interface MemoBlockItemProps {
  block: MarkdownBlock;
  lineIndex: number;
  onToggleCheckbox?: (lineIndex: number) => void;
}

export function MemoBlockItem({
  block,
  lineIndex,
  onToggleCheckbox,
}: MemoBlockItemProps) {
  switch (block.type) {
    case "checkbox": {
      const handleToggle = () => {
        onToggleCheckbox?.(lineIndex);
      };

      return (
        <div className="group flex items-start gap-2.5 py-1">
          <button
            type="button"
            role="checkbox"
            aria-checked={block.checked}
            aria-label={
              block.checked
                ? `${block.content || "체크리스트 항목"} 완료됨`
                : `${block.content || "체크리스트 항목"} 미완료`
            }
            onClick={handleToggle}
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
              block.checked
                ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500"
                : "border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-zinc-500"
            }`}
          >
            {block.checked && (
              <span className="text-xs font-bold leading-none">✓</span>
            )}
          </button>
          <span
            onClick={handleToggle}
            className={`flex-1 cursor-pointer select-none text-sm leading-relaxed transition-colors ${
              block.checked
                ? "text-zinc-400 line-through decoration-zinc-400 dark:text-zinc-500 dark:decoration-zinc-500"
                : "text-zinc-800 dark:text-zinc-200"
            }`}
          >
            {block.content ? (
              <InlineMarkdownText text={block.content} />
            ) : (
              <span className="opacity-40">빈 체크 항목</span>
            )}
          </span>
        </div>
      );
    }

    case "heading": {
      if (block.level === 1) {
        return (
          <h1 className="mt-3.5 mb-1.5 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {block.content ? (
              <InlineMarkdownText text={block.content} />
            ) : (
              "\u00A0"
            )}
          </h1>
        );
      }
      if (block.level === 2) {
        return (
          <h2 className="mt-3 mb-1 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {block.content ? (
              <InlineMarkdownText text={block.content} />
            ) : (
              "\u00A0"
            )}
          </h2>
        );
      }
      return (
        <h3 className="mt-2.5 mb-1 text-base font-semibold text-zinc-800 dark:text-zinc-200">
          {block.content ? (
            <InlineMarkdownText text={block.content} />
          ) : (
            "\u00A0"
          )}
        </h3>
      );
    }

    case "bulletList":
      return (
        <div className="flex items-start gap-2.5 py-0.5 pl-1 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          <span className="select-none text-zinc-400 dark:text-zinc-500">•</span>
          <span className="flex-1">
            {block.content ? (
              <InlineMarkdownText text={block.content} />
            ) : (
              "\u00A0"
            )}
          </span>
        </div>
      );

    case "numberedList":
      return (
        <div className="flex items-start gap-2 py-0.5 pl-1 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          <span className="min-w-[1.25rem] select-none text-xs font-semibold tabular-nums text-zinc-400 dark:text-zinc-500">
            {block.number}.
          </span>
          <span className="flex-1">
            {block.content ? (
              <InlineMarkdownText text={block.content} />
            ) : (
              "\u00A0"
            )}
          </span>
        </div>
      );

    case "divider":
      return (
        <hr className="my-3 border-t border-zinc-200 dark:border-zinc-800" />
      );

    case "text":
    default:
      if (!block.content) {
        return <div className="h-5" />;
      }
      return (
        <p className="min-h-[1.5rem] py-0.5 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          <InlineMarkdownText text={block.content} />
        </p>
      );
  }
}

interface MemoBlockListProps {
  blocks: MarkdownBlock[];
  onToggleCheckbox?: (lineIndex: number) => void;
  className?: string;
}

export function MemoBlockList({
  blocks,
  onToggleCheckbox,
  className = "",
}: MemoBlockListProps) {
  if (blocks.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-zinc-400">
        작성된 내용이 없습니다.
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {blocks.map((block, index) => (
        <MemoBlockItem
          key={block.id}
          block={block}
          lineIndex={index}
          onToggleCheckbox={onToggleCheckbox}
        />
      ))}
    </div>
  );
}
