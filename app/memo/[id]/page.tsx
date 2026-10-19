import { Suspense } from "react";
import { MemoEditorView } from "@/components/memo/MemoEditorView";

interface MemoDetailPageProps {
  params: Promise<{ id: string }>;
}

async function MemoDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MemoEditorView memoId={id} />;
}

export default function MemoDetailPage({ params }: MemoDetailPageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 flex-col items-center justify-center p-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            메모를 불러오는 중...
          </p>
        </main>
      }
    >
      <MemoDetailContent params={params} />
    </Suspense>
  );
}
