export interface Memo {
  id: string;
  coupleId: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoInput {
  title: string;
  content?: string;
}

export interface UpdateMemoInput {
  title?: string;
  content?: string;
  isPinned?: boolean;
}
