import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { getWork, toWorkView } from "@/lib/portfolio";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const work = await getWork(id);
  if (!work) return { title: "作品が見つかりません", robots: { index: false } };

  const view = toWorkView(work);
  const description = (view.summary || view.body).replace(/[#*`>]/g, "").slice(0, 120);
  return {
    title: work.title,
    description,
    openGraph: { title: work.title, description, type: "article" },
  };
}

export default async function WorkPage({ params }: Props) {
  const { id } = await params;
  const work = await getWork(id);
  if (!work) notFound();
  const w = toWorkView(work);

  const facts: [string, string][] = [
    ["時期", w.period],
    ["体制", w.team],
  ].filter((f): f is [string, string] => Boolean(f[1]));

  return (
    <article className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-24 pt-10 sm:px-6">
      <Link href="/#works" className="w-fit text-sm text-dim hover:text-fg">
        ← 作品一覧に戻る
      </Link>

      <header className="flex flex-col gap-4">
        {w.award && <p className="w-fit border-l-2 border-accent pl-3 text-sm font-medium text-accent">{w.award}</p>}
        <h1 className="font-mono text-4xl font-bold leading-tight text-fg sm:text-5xl">{w.title}</h1>
        {w.summary && <p className="max-w-[60ch] text-lg leading-relaxed text-fg">{w.summary}</p>}
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">{w.body && <MarkdownRenderer content={w.body} />}</div>

        <aside className="flex flex-col gap-6 border-t border-line pt-6 text-sm lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          {facts.length > 0 && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              {facts.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-dim">{k}</dt>
                  <dd className="text-fg">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {w.techList.length > 0 && (
            <div>
              <p className="mb-2 text-dim">技術</p>
              <ul className="flex flex-wrap gap-1.5">
                {w.techList.map((t) => (
                  <li key={t} className="rounded border border-line px-2 py-0.5 font-mono text-xs text-fg">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {w.github_url && (
            <a
              href={w.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit rounded border border-line px-3 py-1.5 text-fg hover:border-dim"
            >
              GitHub でコードを見る
            </a>
          )}
        </aside>
      </div>
    </article>
  );
}
