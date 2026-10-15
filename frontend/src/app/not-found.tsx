import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 px-4 py-24 sm:px-6">
      <p className="font-mono text-sm text-dim">404</p>
      <h1 className="text-3xl font-bold text-fg">ページが見つかりません</h1>
      <p className="text-dim">URL が間違っているか、ページが移動した可能性があります。</p>
      <Link href="/" className="mt-2 rounded border border-line px-4 py-2 text-sm text-fg hover:border-dim">
        トップに戻る
      </Link>
    </div>
  );
}
