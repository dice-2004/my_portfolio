"use client";

import Link from "next/link";
import { useState } from "react";
import type { WorkView } from "@/lib/portfolio";

// トップの「すべての作品」。技術のボタンで絞り込む（もう一度押すと解除）。
export default function WorksExplorer({ works, tags }: { works: WorkView[]; tags: string[] }) {
  const [tag, setTag] = useState<string | null>(null);
  const shown = tag ? works.filter((w) => w.techTags.includes(tag)) : works;

  const chip = (label: string, value: string | null) => {
    const active = tag === value;
    return (
      <li key={label}>
        <button
          type="button"
          aria-pressed={active}
          onClick={() => setTag(active ? null : value)}
          className={`rounded border px-2.5 py-1 font-mono text-sm transition-colors ${
            active ? "border-accent bg-accent text-panel" : "border-line text-fg hover:border-dim"
          }`}
        >
          {label}
        </button>
      </li>
    );
  };

  return (
    <div>
      {tags.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          <p id="tech-filter" className="text-sm text-dim">
            技術で絞り込む
          </p>
          <ul aria-labelledby="tech-filter" className="flex flex-wrap gap-2">
            {chip("すべて", null)}
            {tags.map((t) => chip(t, t))}
          </ul>
        </div>
      )}
      <p aria-live="polite" className="mb-2 text-sm text-dim">
        {tag ? `${tag} を使った作品: ${shown.length}件` : `${works.length}件`}
      </p>
      <ul className="border-t border-line">
        {shown.map((w) => (
          <WorkRow key={w.id} work={w} />
        ))}
      </ul>
    </div>
  );
}

function WorkRow({ work }: { work: WorkView }) {
  const cover = work.images[0];
  return (
    <li>
      <Link
        href={`/works/${work.id}`}
        className="group flex gap-4 border-b border-line py-4"
      >
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element -- 画像はバックエンドが配信するので next/image の最適化を通さない
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="hidden aspect-video w-32 shrink-0 rounded border border-line object-cover sm:block"
          />
        )}
        <div className="grid min-w-0 flex-1 gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
          <div className="min-w-0">
            <h3 className="font-bold text-fg group-hover:text-accent">{work.title}</h3>
            {work.award && <p className="mt-0.5 text-sm text-accent">{work.award}</p>}
            {work.summary && <p className="mt-1 line-clamp-2 text-sm text-dim">{work.summary}</p>}
          </div>
          <div className="text-sm text-dim sm:text-right">
            <p>{work.period}</p>
            <p>{work.team}</p>
          </div>
        </div>
      </Link>
    </li>
  );
}
