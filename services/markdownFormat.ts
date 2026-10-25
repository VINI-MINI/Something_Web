import { CHECKBOX_LINE_REGEX } from "@/services/markdownBlock";

export type FormatType =
  | "checkbox"
  | "heading"
  | "bulletList"
  | "numberedList"
  | "text"
  | "divider";

export interface FormatResult {
  nextContent: string;
  nextSelectionStart: number;
  nextSelectionEnd: number;
}

interface ParsedLine {
  indent: string;
  type: FormatType;
  text: string;
  checked?: boolean;
  level?: number;
}

/**
 * 줄 단위 마크다운 서식 분석
 */
function parseLineFormat(line: string): ParsedLine {
  const indentMatch = line.match(/^\s*/);
  const indent = indentMatch ? indentMatch[0] : "";
  const trimmed = line.slice(indent.length);

  // 체크박스 검사 (markdownBlock의 공통 정규식 활용)
  const checkboxMatch = trimmed.match(CHECKBOX_LINE_REGEX);
  if (checkboxMatch) {
    return {
      indent,
      type: "checkbox",
      checked: checkboxMatch[1].toLowerCase() === "x",
      text: checkboxMatch[2],
    };
  }

  // 제목: # ~ ######
  const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
  if (headingMatch) {
    return {
      indent,
      type: "heading",
      level: Math.min(3, headingMatch[1].length),
      text: headingMatch[2],
    };
  }

  // 불릿 목록: - 또는 *
  const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
  if (bulletMatch) {
    return {
      indent,
      type: "bulletList",
      text: bulletMatch[1],
    };
  }

  // 번호 목록: 1. 등
  const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
  if (numberedMatch) {
    return {
      indent,
      type: "numberedList",
      text: numberedMatch[2],
    };
  }

  return {
    indent,
    type: "text",
    text: trimmed,
  };
}

/**
 * 커서 위치의 줄 마크다운 서식 분석 (툴바 활성 상태 표시용)
 */
export function detectFormatAtCursor(
  content: string,
  cursorOffset: number,
): { activeType: FormatType; level?: number } {
  const lineStart = content.lastIndexOf("\n", cursorOffset - 1) + 1;
  let lineEnd = content.indexOf("\n", cursorOffset);
  if (lineEnd === -1) {
    lineEnd = content.length;
  }
  const currentLine = content.slice(lineStart, lineEnd);
  const parsed = parseLineFormat(currentLine);
  return {
    activeType: parsed.type,
    level: parsed.level,
  };
}

/**
 * 마크다운 원문에서 커서가 위치한 줄에 특정 서식을 주입하거나 토글
 */
export function applyFormatToMarkdownText(
  content: string,
  selectionStart: number,
  selectionEnd: number,
  targetType: FormatType,
): FormatResult {
  // 1. 커서 위치 기준 현재 줄 범위 탐색
  const lineStart = content.lastIndexOf("\n", selectionStart - 1) + 1;
  let lineEnd = content.indexOf("\n", selectionStart);
  if (lineEnd === -1) {
    lineEnd = content.length;
  }

  // 2. 구분선 삽입: 현재 줄 뒤에 삽입
  if (targetType === "divider") {
    const dividerText = "\n\n---\n\n";
    const nextContent =
      content.slice(0, lineEnd) + dividerText + content.slice(lineEnd);
    const nextPos = lineEnd + dividerText.length;
    return {
      nextContent,
      nextSelectionStart: nextPos,
      nextSelectionEnd: nextPos,
    };
  }

  const currentLine = content.slice(lineStart, lineEnd);
  const parsed = parseLineFormat(currentLine);
  let newLine = "";

  if (targetType === "checkbox") {
    if (parsed.type === "checkbox") {
      const nextChecked = !parsed.checked;
      newLine = `${parsed.indent}- [${nextChecked ? "x" : " "}] ${parsed.text}`;
    } else {
      newLine = `${parsed.indent}- [ ] ${parsed.text}`;
    }
  } else if (targetType === "heading") {
    if (parsed.type === "heading") {
      const nextLevel = parsed.level === 3 ? 1 : (parsed.level || 1) + 1;
      const prefix = "#".repeat(nextLevel);
      newLine = `${parsed.indent}${prefix} ${parsed.text}`;
    } else {
      newLine = `${parsed.indent}# ${parsed.text}`;
    }
  } else if (targetType === "bulletList") {
    if (parsed.type === "bulletList") {
      newLine = `${parsed.indent}${parsed.text}`;
    } else {
      newLine = `${parsed.indent}- ${parsed.text}`;
    }
  } else if (targetType === "numberedList") {
    if (parsed.type === "numberedList") {
      newLine = `${parsed.indent}${parsed.text}`;
    } else {
      newLine = `${parsed.indent}1. ${parsed.text}`;
    }
  } else if (targetType === "text") {
    newLine = `${parsed.indent}${parsed.text}`;
  }

  const nextContent =
    content.slice(0, lineStart) + newLine + content.slice(lineEnd);
  const delta = newLine.length - currentLine.length;

  const nextSelectionStart = Math.max(
    lineStart,
    Math.min(lineStart + newLine.length, selectionStart + delta),
  );
  const nextSelectionEnd = Math.max(
    nextSelectionStart,
    selectionEnd + delta,
  );

  return {
    nextContent,
    nextSelectionStart,
    nextSelectionEnd,
  };
}
