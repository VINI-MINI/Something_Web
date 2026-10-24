"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { InlineMarkdownText } from "@/components/memo/InlineMarkdownText";
import {
  stringifyBlocksToMarkdown,
  toggleCheckboxBlock,
} from "@/services/markdownBlock";
import type { MarkdownBlock } from "@/types/markdown";

interface AutoResizeTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

/**
 * 내용 길이에 따라 자동으로 높이가 조절되는 단일 줄/여러 줄 텍스트 영역
 */
function AutoResizeTextarea({
  value,
  onChange,
  onBlur,
  placeholder,
  className = "",
  autoFocus = false,
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [adjustHeight, value]);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [autoFocus]);

  return (
    <textarea
      ref={textareaRef}
      rows={1}
      value={value}
      onChange={(e) => {
        adjustHeight();
        onChange(e.target.value);
      }}
      onBlur={onBlur}
      placeholder={placeholder}
      className={`w-full resize-none overflow-hidden bg-transparent focus:outline-none ${className}`}
    />
  );
}

interface MemoBlockEditorProps {
  blocks: MarkdownBlock[];
  onChangeContent?: (newContent: string) => void;
  onBlur?: () => void;
}

/**
 * 하이브리드 블록 인라인 편집기
 * - 포커스되지 않은 줄: 실제 마크다운 서식(크기, 굵기, 체크박스 등)으로 렌더링
 * - 포커스된 줄: 뷰어와 동일한 스타일의 인라인 입력창으로 즉시 전환되어 타이핑
 */
export function MemoBlockEditor({
  blocks,
  onChangeContent,
  onBlur,
}: MemoBlockEditorProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // 빈 메모일 경우 기본 첫 줄 제공
  const effectiveBlocks: MarkdownBlock[] =
    blocks.length > 0
      ? blocks
      : [{ id: "initial-empty-block", type: "text", content: "" }];

  const handleUpdateBlockContent = (index: number, newContent: string) => {
    const nextBlocks = [...effectiveBlocks];
    const targetBlock = nextBlocks[index];

    if (!targetBlock || targetBlock.type === "divider") {
      return;
    }

    nextBlocks[index] = {
      ...targetBlock,
      content: newContent,
    };

    const nextMarkdown = stringifyBlocksToMarkdown(nextBlocks);
    onChangeContent?.(nextMarkdown);
  };

  const handleToggleCheckbox = (index: number) => {
    const nextBlocks = [...effectiveBlocks];
    const target = nextBlocks[index];
    if (target && target.type === "checkbox") {
      nextBlocks[index] = toggleCheckboxBlock(target);
      const nextMarkdown = stringifyBlocksToMarkdown(nextBlocks);
      onChangeContent?.(nextMarkdown);
    }
  };

  const handleInputBlur = () => {
    setFocusedIndex(null);
    onBlur?.();
  };

  return (
    <div className="flex flex-1 flex-col py-1">
      {effectiveBlocks.map((block, index) => {
        const isFocused = focusedIndex === index;

        switch (block.type) {
          case "checkbox": {
            return (
              <div
                key={block.id}
                className="group flex items-start gap-2.5 py-1"
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={block.checked}
                  onClick={() => handleToggleCheckbox(index)}
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

                {isFocused ? (
                  <AutoResizeTextarea
                    value={block.content}
                    onChange={(val) => handleUpdateBlockContent(index, val)}
                    onBlur={handleInputBlur}
                    placeholder="체크리스트 항목 입력..."
                    autoFocus
                    className={`flex-1 text-sm leading-relaxed ${
                      block.checked
                        ? "text-zinc-400 line-through decoration-zinc-400 dark:text-zinc-500 dark:decoration-zinc-500"
                        : "text-zinc-800 dark:text-zinc-200"
                    }`}
                  />
                ) : (
                  <div
                    onClick={() => setFocusedIndex(index)}
                    className={`min-h-[1.5rem] flex-1 cursor-text text-sm leading-relaxed ${
                      block.checked
                        ? "text-zinc-400 line-through decoration-zinc-400 dark:text-zinc-500 dark:decoration-zinc-500"
                        : "text-zinc-800 dark:text-zinc-200"
                    }`}
                  >
                    {block.content ? (
                      <InlineMarkdownText text={block.content} />
                    ) : (
                      <span className="opacity-40">체크리스트 항목 입력...</span>
                    )}
                  </div>
                )}
              </div>
            );
          }

          case "heading": {
            const headingClass =
              block.level === 1
                ? "text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
                : block.level === 2
                  ? "text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
                  : "text-base font-semibold text-zinc-800 dark:text-zinc-200";

            const spacingClass =
              block.level === 1
                ? "mt-3.5 mb-1.5"
                : block.level === 2
                  ? "mt-3 mb-1"
                  : "mt-2.5 mb-1";

            return (
              <div key={block.id} className={spacingClass}>
                {isFocused ? (
                  <AutoResizeTextarea
                    value={block.content}
                    onChange={(val) => handleUpdateBlockContent(index, val)}
                    onBlur={handleInputBlur}
                    placeholder={`제목 (H${block.level}) 입력...`}
                    autoFocus
                    className={`w-full ${headingClass}`}
                  />
                ) : (
                  <div
                    onClick={() => setFocusedIndex(index)}
                    className={`min-h-[1.75rem] w-full cursor-text ${headingClass}`}
                  >
                    {block.content ? (
                      <InlineMarkdownText text={block.content} />
                    ) : (
                      <span className="opacity-30">
                        제목 (H{block.level}) 입력...
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          }

          case "bulletList": {
            return (
              <div
                key={block.id}
                className="flex items-start gap-2.5 py-0.5 pl-1 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
              >
                <span className="select-none text-zinc-400 dark:text-zinc-500">
                  •
                </span>
                {isFocused ? (
                  <AutoResizeTextarea
                    value={block.content}
                    onChange={(val) => handleUpdateBlockContent(index, val)}
                    onBlur={handleInputBlur}
                    placeholder="목록 항목 입력..."
                    autoFocus
                    className="flex-1 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
                  />
                ) : (
                  <div
                    onClick={() => setFocusedIndex(index)}
                    className="min-h-[1.5rem] flex-1 cursor-text"
                  >
                    {block.content ? (
                      <InlineMarkdownText text={block.content} />
                    ) : (
                      <span className="opacity-30">목록 항목 입력...</span>
                    )}
                  </div>
                )}
              </div>
            );
          }

          case "numberedList": {
            return (
              <div
                key={block.id}
                className="flex items-start gap-2 py-0.5 pl-1 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
              >
                <span className="min-w-[1.25rem] select-none text-xs font-semibold tabular-nums text-zinc-400 dark:text-zinc-500">
                  {block.number}.
                </span>
                {isFocused ? (
                  <AutoResizeTextarea
                    value={block.content}
                    onChange={(val) => handleUpdateBlockContent(index, val)}
                    onBlur={handleInputBlur}
                    placeholder="번호 목록 항목 입력..."
                    autoFocus
                    className="flex-1 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
                  />
                ) : (
                  <div
                    onClick={() => setFocusedIndex(index)}
                    className="min-h-[1.5rem] flex-1 cursor-text"
                  >
                    {block.content ? (
                      <InlineMarkdownText text={block.content} />
                    ) : (
                      <span className="opacity-30">
                        번호 목록 항목 입력...
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          }

          case "divider": {
            return (
              <div key={block.id} className="py-1">
                <hr className="my-3 border-t border-zinc-200 dark:border-zinc-800" />
              </div>
            );
          }

          case "text":
          default: {
            return (
              <div key={block.id} className="py-0.5">
                {isFocused ? (
                  <AutoResizeTextarea
                    value={block.content}
                    onChange={(val) => handleUpdateBlockContent(index, val)}
                    onBlur={handleInputBlur}
                    placeholder="내용을 입력하세요..."
                    autoFocus
                    className="min-h-[1.5rem] w-full text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
                  />
                ) : (
                  <div
                    onClick={() => setFocusedIndex(index)}
                    className="min-h-[1.5rem] w-full cursor-text text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
                  >
                    {block.content ? (
                      <InlineMarkdownText text={block.content} />
                    ) : (
                      <span className="opacity-30">내용을 입력하세요...</span>
                    )}
                  </div>
                )}
              </div>
            );
          }
        }
      })}
    </div>
  );
}
