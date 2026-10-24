"use client";

import type { ReactNode } from "react";

interface InlineMarkdownTextProps {
  text: string;
  className?: string;
}

/**
 * 인라인 마크다운 정규식 토크나이저
 * dangerouslySetInnerHTML 없이 안전한 React 엘리먼트 트리로 렌더링하며 중첩 서식을 지원합니다.
 * 지원 서식:
 * - 인라인 코드: `code`
 * - 굵게: **bold** 또는 __bold__
 * - 취소선: ~~strike~~
 * - 밑줄: ++underline++ 또는 <u>underline</u>
 * - 기울임: *italic* 또는 _italic_
 */
function parseInlineMarkdown(text: string, depth = 0): ReactNode[] {
  if (!text) {
    return [];
  }
  // 중첩 깊이 안전 제한
  if (depth > 5) {
    return [text];
  }

  const regex =
    /`(?<code_content>[^\n`]+?)`|\*\*(?<bold_star>[^\n]+?)\*\*|__(?<bold_under>[^\n]+?)__|~~(?<strike>[^\n]+?)~~|\+\+(?<under_plus>[^\n]+?)\+\+|<[uU]>(?<under_tag>[^\n]+?)<\/[uU]>|\*(?<italic_star>[^\n]+?)\*|_(?<italic_under>[^\n]+?)_/g;

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // 매치 이전 일반 텍스트
    if (match.index > lastIndex) {
      nodes.push(
        <span key={`${depth}-txt-${lastIndex}`}>
          {text.slice(lastIndex, match.index)}
        </span>
      );
    }

    const groups = match.groups || {};
    const key = `${depth}-${match.index}`;

    if (groups.code_content !== undefined) {
      nodes.push(
        <code
          key={key}
          className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs text-pink-600 dark:bg-zinc-800 dark:text-pink-400"
        >
          {groups.code_content}
        </code>
      );
    } else if (
      groups.bold_star !== undefined ||
      groups.bold_under !== undefined
    ) {
      const content = groups.bold_star ?? groups.bold_under;
      nodes.push(
        <strong key={key} className="font-semibold">
          {parseInlineMarkdown(content, depth + 1)}
        </strong>
      );
    } else if (groups.strike !== undefined) {
      nodes.push(
        <del
          key={key}
          className="line-through decoration-zinc-400 opacity-75 dark:decoration-zinc-500"
        >
          {parseInlineMarkdown(groups.strike, depth + 1)}
        </del>
      );
    } else if (
      groups.under_plus !== undefined ||
      groups.under_tag !== undefined
    ) {
      const content = groups.under_plus ?? groups.under_tag;
      nodes.push(
        <u key={key} className="underline underline-offset-2">
          {parseInlineMarkdown(content, depth + 1)}
        </u>
      );
    } else if (
      groups.italic_star !== undefined ||
      groups.italic_under !== undefined
    ) {
      const content = groups.italic_star ?? groups.italic_under;
      nodes.push(
        <em key={key} className="italic">
          {parseInlineMarkdown(content, depth + 1)}
        </em>
      );
    }

    lastIndex = regex.lastIndex;
  }

  // 매칭된 서식이 전혀 없으면 원본 텍스트 그대로 반환 (불필요한 wrapper DOM 생성 방지)
  if (lastIndex === 0 && nodes.length === 0) {
    return [text];
  }

  // 매치 이후 남은 일반 텍스트
  if (lastIndex < text.length) {
    nodes.push(
      <span key={`${depth}-txt-${lastIndex}`}>{text.slice(lastIndex)}</span>
    );
  }

  return nodes;
}

export function InlineMarkdownText({
  text,
  className,
}: InlineMarkdownTextProps) {
  if (!text) {
    return null;
  }

  const nodes = parseInlineMarkdown(text);

  if (className) {
    return <span className={className}>{nodes}</span>;
  }

  return <>{nodes}</>;
}
