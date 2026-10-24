export interface BaseBlock {
  readonly id: string;
}

export interface BulletListBlock extends BaseBlock {
  readonly type: "bulletList";
  readonly content: string;
}

export interface CheckboxBlock extends BaseBlock {
  readonly type: "checkbox";
  readonly checked: boolean;
  readonly content: string;
}

export interface DividerBlock extends BaseBlock {
  readonly type: "divider";
}

export interface HeadingBlock extends BaseBlock {
  readonly type: "heading";
  readonly level: 1 | 2 | 3;
  readonly content: string;
}

export interface NumberedListBlock extends BaseBlock {
  readonly type: "numberedList";
  readonly number: number;
  readonly content: string;
}

export interface TextBlock extends BaseBlock {
  readonly type: "text";
  readonly content: string;
}

export type MarkdownBlock =
  | BulletListBlock
  | CheckboxBlock
  | DividerBlock
  | HeadingBlock
  | NumberedListBlock
  | TextBlock;

export type MarkdownBlockType = MarkdownBlock["type"];
