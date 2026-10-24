import type { CheckboxBlock, MarkdownBlock } from "@/types/markdown";

let blockCounter = 0;

export function generateBlockId(): string {
  blockCounter += 1;
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `b_${Date.now().toString(36)}_${blockCounter}_${randomPart}`;
}

export function fromRawText(raw: string, id?: string): MarkdownBlock {
  const blockId = id ?? generateBlockId();

  // 1. 구분선(Divider) 검사: ---, ***, ___ (3개 이상)
  if (/^\s*(\*{3,}|-{3,}|_{3,})\s*$/.test(raw)) {
    return {
      id: blockId,
      type: "divider",
    };
  }

  // 2. 체크박스 검사: - [ ], [ ], * [ ] (공백/들여쓰기 및 괄호 뒤 공백 유무 무관)
  const checkboxMatch = raw.match(/^\s*[-*]?\s*\[([ xX])\]\s*(.*)$/);
  if (checkboxMatch) {
    return {
      id: blockId,
      type: "checkbox",
      checked: checkboxMatch[1].toLowerCase() === "x",
      content: checkboxMatch[2],
    };
  }

  // 3. 글머리 기호 목록(Bullet List) 검사: - 항목 또는 * 항목
  const bulletMatch = raw.match(/^\s*[-*]\s+(.*)$/);
  if (bulletMatch) {
    return {
      id: blockId,
      type: "bulletList",
      content: bulletMatch[1],
    };
  }

  // 4. 번호 매기기 목록(Numbered List) 검사: 1. 항목, 2. 항목 등
  const numberedMatch = raw.match(/^\s*(\d+)\.\s+(.*)$/);
  if (numberedMatch) {
    return {
      id: blockId,
      type: "numberedList",
      number: parseInt(numberedMatch[1], 10),
      content: numberedMatch[2],
    };
  }

  // 5. 헤딩 검사: #, ##, ###
  const headingMatch = raw.match(/^\s*(#{1,3})\s+(.*)$/);
  if (headingMatch) {
    return {
      id: blockId,
      type: "heading",
      level: headingMatch[1].length as 1 | 2 | 3,
      content: headingMatch[2],
    };
  }

  // 6. 일반 텍스트
  return {
    id: blockId,
    type: "text",
    content: raw,
  };
}

export function toRawText(block: MarkdownBlock): string {
  switch (block.type) {
    case "bulletList":
      return `- ${block.content}`;
    case "checkbox": {
      const checkMark = block.checked ? "x" : " ";
      return `- [${checkMark}] ${block.content}`;
    }
    case "divider":
      return "---";
    case "heading":
      return `${"#".repeat(block.level)} ${block.content}`;
    case "numberedList":
      return `${block.number}. ${block.content}`;
    case "text":
      return block.content;
  }
}

export function parseMarkdownToBlocks(markdown: string): MarkdownBlock[] {
  if (!markdown) {
    return [];
  }

  const normalized = markdown.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  return lines.map((line, index) => fromRawText(line, `line_${index}`));
}

export function stringifyBlocksToMarkdown(blocks: MarkdownBlock[]): string {
  return blocks.map(toRawText).join("\n");
}

export function toggleCheckboxBlock(block: CheckboxBlock): CheckboxBlock {
  return {
    ...block,
    checked: !block.checked,
  };
}

export function isCheckboxLine(line: string): boolean {
  return /^\s*[-*]?\s*\[([ xX])\]\s*(.*)$/.test(line);
}

export function toggleCheckboxAtLine(
  markdown: string,
  lineIndex: number,
): string {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  if (lineIndex < 0 || lineIndex >= lines.length) {
    return markdown;
  }

  const targetLine = lines[lineIndex];
  const match = targetLine.match(/^(\s*[-*]?\s*\[)([ xX])(\]\s*.*)$/);
  if (!match) {
    return markdown;
  }

  const prefix = match[1];
  const currentMark = match[2];
  const suffix = match[3];
  const nextMark = currentMark.toLowerCase() === "x" ? " " : "x";

  lines[lineIndex] = `${prefix}${nextMark}${suffix}`;
  return lines.join("\n");
}
