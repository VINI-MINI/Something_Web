"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { InlineMarkdownText } from "@/components/memo/InlineMarkdownText";
import {
  stringifyBlocksToMarkdown,
  toggleCheckboxBlock,
} from "@/services/markdownBlock";
import type { MarkdownBlock, NumberedListBlock } from "@/types/markdown";

interface AutoResizeTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  cursorPos?: "start" | "end" | number;
}

/**
 * 내용 길이에 따라 자동으로 높이가 조절되는 단일 줄/여러 줄 텍스트 영역
 */
function AutoResizeTextarea({
  value,
  onChange,
  onKeyDown,
  onBlur,
  placeholder,
  className = "",
  autoFocus = false,
  cursorPos = "end",
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
      if (cursorPos === "start") {
        textareaRef.current.setSelectionRange(0, 0);
      } else if (typeof cursorPos === "number") {
        textareaRef.current.setSelectionRange(cursorPos, cursorPos);
      } else {
        textareaRef.current.setSelectionRange(len, len);
      }
    }
  }, [autoFocus, cursorPos]);

  return (
    <textarea
      ref={textareaRef}
      rows={1}
      value={value}
      onChange={(e) => {
        adjustHeight();
        onChange(e.target.value);
      }}
      onKeyDown={onKeyDown}
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
 * - 2단계 백스페이스: 빈 서식 줄에서 1회 누르면 서식 벗기기 -> 1회 더 누르면 윗줄 병합/삭제
 * - 엔터: 체크박스/리스트 연속 생성 및 빈 줄에서 탈출, 텍스트 분할
 * - 방향키: PC 키보드 위/아래 이동 시 이전/다음 블록으로 포커스 전환
 */
export function MemoBlockEditor({
  blocks,
  onChangeContent,
  onBlur,
}: MemoBlockEditorProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [cursorPos, setCursorPos] = useState<"start" | "end" | number>("end");

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

    // 개행 문자가 포함되어 있는 경우 (붙여넣기 등) 안전하게 블록 단위 분할
    if (newContent.includes("\n")) {
      const lines = newContent.replace(/\r\n/g, "\n").split("\n");
      const insertedBlocks = lines.map((line, offset) => {
        if (offset === 0) {
          return {
            ...targetBlock,
            content: line,
          };
        }
        return {
          id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type:
            targetBlock.type === "checkbox"
              ? ("checkbox" as const)
              : ("text" as const),
          ...(targetBlock.type === "checkbox" ? { checked: false } : {}),
          content: line,
        };
      });

      nextBlocks.splice(index, 1, ...insertedBlocks);
      const nextMarkdown = stringifyBlocksToMarkdown(nextBlocks);
      onChangeContent?.(nextMarkdown);
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

  const handleTransformBlock = (
    targetType:
      | "checkbox"
      | "bulletList"
      | "numberedList"
      | "heading"
      | "text"
      | "divider",
  ) => {
    const index = focusedIndex ?? effectiveBlocks.length - 1;
    if (index < 0 || index >= effectiveBlocks.length) {
      return;
    }

    const currentBlock = effectiveBlocks[index];
    const nextBlocks = [...effectiveBlocks];
    const content = currentBlock.type === "divider" ? "" : currentBlock.content;

    if (targetType === "checkbox") {
      if (currentBlock.type === "checkbox") {
        nextBlocks[index] = toggleCheckboxBlock(currentBlock);
      } else {
        nextBlocks[index] = {
          id: currentBlock.id,
          type: "checkbox",
          checked: false,
          content,
        };
      }
    } else if (targetType === "heading") {
      if (currentBlock.type === "heading") {
        const nextLevel = (currentBlock.level === 3 ? 1 : currentBlock.level + 1) as
          | 1
          | 2
          | 3;
        nextBlocks[index] = {
          id: currentBlock.id,
          type: "heading",
          level: nextLevel,
          content,
        };
      } else {
        nextBlocks[index] = {
          id: currentBlock.id,
          type: "heading",
          level: 1,
          content,
        };
      }
    } else if (targetType === "bulletList") {
      nextBlocks[index] = {
        id: currentBlock.id,
        type: "bulletList",
        content,
      };
    } else if (targetType === "numberedList") {
      nextBlocks[index] = {
        id: currentBlock.id,
        type: "numberedList",
        number: 1,
        content,
      };
    } else if (targetType === "text") {
      nextBlocks[index] = {
        id: currentBlock.id,
        type: "text",
        content,
      };
    } else if (targetType === "divider") {
      const dividerId = `b_${Date.now()}_div`;
      const nextTextId = `b_${Date.now()}_txt`;
      nextBlocks.splice(
        index + 1,
        0,
        { id: dividerId, type: "divider" },
        { id: nextTextId, type: "text", content: "" },
      );
      setFocusedIndex(index + 2);
      setCursorPos("start");
      const nextMarkdown = stringifyBlocksToMarkdown(nextBlocks);
      onChangeContent?.(nextMarkdown);
      return;
    }

    const nextMarkdown = stringifyBlocksToMarkdown(nextBlocks);
    onChangeContent?.(nextMarkdown);
    setFocusedIndex(index);
    setCursorPos("end");
  };

  const handleKeyDown = (
    index: number,
    block: MarkdownBlock,
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    // 한글 IME 조합 중에는 엔터/키보드 이벤트 중복 방지
    if (e.nativeEvent.isComposing) {
      return;
    }

    const target = e.currentTarget;
    const { selectionStart, selectionEnd, value } = target;

    // 1. Enter 키 처리 (Shift+Enter 포함: 단일 블록 내 줄바꿈 삽입으로 인한 구조 왜곡 방지)
    if (e.key === "Enter") {
      e.preventDefault();

      // 1-1. 내용이 없는 빈 체크박스 / 리스트에서 엔터 -> 목록 탈출 (일반 텍스트 줄로 변환)
      if (
        (block.type === "checkbox" ||
          block.type === "bulletList" ||
          block.type === "numberedList") &&
        block.content.trim() === ""
      ) {
        const nextBlocks = [...effectiveBlocks];
        nextBlocks[index] = {
          id: block.id,
          type: "text",
          content: "",
        };
        const nextMarkdown = stringifyBlocksToMarkdown(nextBlocks);
        onChangeContent?.(nextMarkdown);
        setFocusedIndex(index);
        setCursorPos("end");
        return;
      }

      // 1-2. 커서 위치 기준 텍스트 분할
      const leftText = value.slice(0, selectionStart);
      const rightText = value.slice(selectionEnd);

      const nextBlocks = [...effectiveBlocks];
      nextBlocks[index] = {
        ...block,
        content: leftText,
      };

      // 다음 줄에 삽입할 새 블록 결정
      let newBlock: MarkdownBlock;
      const newBlockId = `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      if (block.type === "checkbox") {
        newBlock = {
          id: newBlockId,
          type: "checkbox",
          checked: false,
          content: rightText,
        };
      } else if (block.type === "bulletList") {
        newBlock = {
          id: newBlockId,
          type: "bulletList",
          content: rightText,
        };
      } else if (block.type === "numberedList") {
        newBlock = {
          id: newBlockId,
          type: "numberedList",
          number: block.number + 1,
          content: rightText,
        };
      } else {
        // heading 또는 text -> 다음 줄은 일반 text 블록 생성
        newBlock = {
          id: newBlockId,
          type: "text",
          content: rightText,
        };
      }

      nextBlocks.splice(index + 1, 0, newBlock);

      // 번호 목록인 경우, 이후 번호 목록들의 넘버링 업데이트
      if (block.type === "numberedList") {
        for (let i = index + 2; i < nextBlocks.length; i++) {
          const item = nextBlocks[i];
          if (item && item.type === "numberedList") {
            (nextBlocks[i] as NumberedListBlock).number += 1;
          } else {
            break;
          }
        }
      }

      const nextMarkdown = stringifyBlocksToMarkdown(nextBlocks);
      onChangeContent?.(nextMarkdown);
      setFocusedIndex(index + 1);
      setCursorPos("start");
      return;
    }

    // 2. Backspace 키 처리 (2단계 서식 벗기기 및 줄 병합)
    if (e.key === "Backspace") {
      // 커서가 맨 앞(0)이거나 내용이 비어있을 때
      if (selectionStart === 0 && selectionEnd === 0) {
        // 단계 1: 서식 블록(체크박스, 헤딩, 리스트)인 경우 -> 서식 벗겨서 일반 텍스트로 변환
        if (
          block.type === "checkbox" ||
          block.type === "heading" ||
          block.type === "bulletList" ||
          block.type === "numberedList"
        ) {
          e.preventDefault();
          const nextBlocks = [...effectiveBlocks];
          nextBlocks[index] = {
            id: block.id,
            type: "text",
            content: block.content,
          };
          const nextMarkdown = stringifyBlocksToMarkdown(nextBlocks);
          onChangeContent?.(nextMarkdown);
          setFocusedIndex(index);
          setCursorPos("start");
          return;
        }

        // 단계 2: 이미 일반 텍스트 줄인 경우 -> 윗줄 끝으로 내용 병합 및 현재 줄 삭제
        if (block.type === "text" && index > 0) {
          e.preventDefault();
          const prevBlock = effectiveBlocks[index - 1];

          // 윗줄이 구분선(divider)인 경우 -> 구분선 삭제
          if (prevBlock.type === "divider") {
            const nextBlocks = [...effectiveBlocks];
            nextBlocks.splice(index - 1, 1);
            const nextMarkdown = stringifyBlocksToMarkdown(nextBlocks);
            onChangeContent?.(nextMarkdown);
            setFocusedIndex(index - 1);
            setCursorPos("end");
            return;
          }

          const prevLen = prevBlock.content.length;
          const mergedContent = prevBlock.content + block.content;

          const nextBlocks = [...effectiveBlocks];
          nextBlocks[index - 1] = {
            ...prevBlock,
            content: mergedContent,
          };
          nextBlocks.splice(index, 1);

          const nextMarkdown = stringifyBlocksToMarkdown(nextBlocks);
          onChangeContent?.(nextMarkdown);
          setFocusedIndex(index - 1);
          setCursorPos(prevLen);
          return;
        }
      }
    }

    // 3. ArrowUp (윗줄로 포커스 이동)
    if (e.key === "ArrowUp") {
      const isFirstLine = !value.slice(0, selectionStart).includes("\n");
      if (isFirstLine && index > 0) {
        e.preventDefault();
        setFocusedIndex(index - 1);
        setCursorPos("end");
        return;
      }
    }

    // 4. ArrowDown (아랫줄로 포커스 이동)
    if (e.key === "ArrowDown") {
      const isLastLine = !value.slice(selectionEnd).includes("\n");
      if (isLastLine && index < effectiveBlocks.length - 1) {
        e.preventDefault();
        setFocusedIndex(index + 1);
        setCursorPos("end");
        return;
      }
    }
  };

  const activeBlock =
    focusedIndex !== null ? effectiveBlocks[focusedIndex] : null;

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
                    onKeyDown={(e) => handleKeyDown(index, block, e)}
                    onBlur={handleInputBlur}
                    placeholder=""
                    autoFocus
                    cursorPos={cursorPos}
                    className={`flex-1 text-sm leading-relaxed ${
                      block.checked
                        ? "text-zinc-400 line-through decoration-zinc-400 dark:text-zinc-500 dark:decoration-zinc-500"
                        : "text-zinc-800 dark:text-zinc-200"
                    }`}
                  />
                ) : (
                  <div
                    onClick={() => {
                      setFocusedIndex(index);
                      setCursorPos("end");
                    }}
                    className={`min-h-[1.5rem] flex-1 cursor-text text-sm leading-relaxed ${
                      block.checked
                        ? "text-zinc-400 line-through decoration-zinc-400 dark:text-zinc-500 dark:decoration-zinc-500"
                        : "text-zinc-800 dark:text-zinc-200"
                    }`}
                  >
                    {block.content ? (
                      <InlineMarkdownText text={block.content} />
                    ) : (
                      "\u00A0"
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
                    onKeyDown={(e) => handleKeyDown(index, block, e)}
                    onBlur={handleInputBlur}
                    placeholder=""
                    autoFocus
                    cursorPos={cursorPos}
                    className={`w-full ${headingClass}`}
                  />
                ) : (
                  <div
                    onClick={() => {
                      setFocusedIndex(index);
                      setCursorPos("end");
                    }}
                    className={`min-h-[1.75rem] w-full cursor-text ${headingClass}`}
                  >
                    {block.content ? (
                      <InlineMarkdownText text={block.content} />
                    ) : (
                      "\u00A0"
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
                    onKeyDown={(e) => handleKeyDown(index, block, e)}
                    onBlur={handleInputBlur}
                    placeholder=""
                    autoFocus
                    cursorPos={cursorPos}
                    className="flex-1 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
                  />
                ) : (
                  <div
                    onClick={() => {
                      setFocusedIndex(index);
                      setCursorPos("end");
                    }}
                    className="min-h-[1.5rem] flex-1 cursor-text"
                  >
                    {block.content ? (
                      <InlineMarkdownText text={block.content} />
                    ) : (
                      "\u00A0"
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
                    onKeyDown={(e) => handleKeyDown(index, block, e)}
                    onBlur={handleInputBlur}
                    placeholder=""
                    autoFocus
                    cursorPos={cursorPos}
                    className="flex-1 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
                  />
                ) : (
                  <div
                    onClick={() => {
                      setFocusedIndex(index);
                      setCursorPos("end");
                    }}
                    className="min-h-[1.5rem] flex-1 cursor-text"
                  >
                    {block.content ? (
                      <InlineMarkdownText text={block.content} />
                    ) : (
                      "\u00A0"
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
                    onKeyDown={(e) => handleKeyDown(index, block, e)}
                    onBlur={handleInputBlur}
                    placeholder=""
                    autoFocus
                    cursorPos={cursorPos}
                    className="min-h-[1.5rem] w-full text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
                  />
                ) : (
                  <div
                    onClick={() => {
                      setFocusedIndex(index);
                      setCursorPos("end");
                    }}
                    className="min-h-[1.5rem] w-full cursor-text text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
                  >
                    {block.content ? (
                      <InlineMarkdownText text={block.content} />
                    ) : (
                      "\u00A0"
                    )}
                  </div>
                )}
              </div>
            );
          }
        }
      })}

      {/* 하단 퀵 서식 툴바 (모바일 & PC 공통 지원) */}
      <div className="sticky bottom-4 z-20 mt-6 flex justify-center">
        <div className="flex items-center gap-1 rounded-2xl border border-zinc-200/90 bg-white/95 p-1.5 shadow-lg backdrop-blur-md dark:border-zinc-800/90 dark:bg-zinc-900/95">
          {/* 체크박스 */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleTransformBlock("checkbox")}
            title="체크리스트로 변환"
            className={`flex h-8 items-center gap-1 rounded-xl px-2.5 text-xs font-medium transition ${
              activeBlock?.type === "checkbox"
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
            onClick={() => handleTransformBlock("heading")}
            title="제목으로 변환 (H1/H2/H3)"
            className={`flex h-8 items-center gap-1 rounded-xl px-2.5 text-xs font-medium transition ${
              activeBlock?.type === "heading"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold"
                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            <span>
              {activeBlock?.type === "heading" ? `H${activeBlock.level}` : "H"}
            </span>
            <span>제목</span>
          </button>

          {/* 불릿 목록 */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleTransformBlock("bulletList")}
            title="글머리 기호 목록으로 변환"
            className={`flex h-8 items-center gap-1 rounded-xl px-2.5 text-xs font-medium transition ${
              activeBlock?.type === "bulletList"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold"
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
            onClick={() => handleTransformBlock("numberedList")}
            title="번호 매기기 목록으로 변환"
            className={`flex h-8 items-center gap-1 rounded-xl px-2.5 text-xs font-medium transition ${
              activeBlock?.type === "numberedList"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold"
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
            onClick={() => handleTransformBlock("text")}
            title="일반 본문으로 변환"
            className={`flex h-8 items-center gap-1 rounded-xl px-2.5 text-xs font-medium transition ${
              activeBlock?.type === "text"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold"
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
            onClick={() => handleTransformBlock("divider")}
            title="구분선 삽입"
            className="flex h-8 items-center gap-1 rounded-xl px-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <span>―</span>
          </button>
        </div>
      </div>
    </div>
  );
}
