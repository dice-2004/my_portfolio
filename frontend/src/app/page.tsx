import Link from "next/link";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import AskButton from "@/components/cli/AskButton";
import { profile } from "@/content/profile";
import { getPortfolio, toWorkView, type Skill, type Timeline, type WorkView } from "@/lib/portfolio";

function sortTimeline(items: Timeline[]): Timeline[] {
  // event_date は "2025.05.17" や "2023.04 - 2027.03" の形。先頭の日付で新しい順に並べる。
  const key = (t: Timeline) => t.event_date.split(" - ")[0].trim();
  return [...items].sort((a, b) => key(b).localeCompare(key(a)));
}

function groupSkills(skills: Skill[]): [string, Skill[]][] {
  const map = new Map<string, Skill[]>();
  for (const s of [...skills].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))) {
    const k = s.category || "その他";
    map.set(k, [...(map.get(k) ?? []), s]);
  }
  return [...map.entries()];
}

function SectionHeading({ id, title, note }: { id: string; title: string; note?: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <h2 id={id} className="scroll-mt-20 font-mono text-2xl font-bold text-fg">
        {title}
      </h2>
      {note && <p className="text-sm text-dim">{note}</p>}
    </div>
  );
}

function Meta({ work }: { work: WorkView }) {
  const items = [work.period, work.team].filter(Boolean);
  return items.length ? <p className="text-sm text-dim">{items.join(" · ")}</p> : null;
}

function FeaturedWork({ work }: { work: WorkView }) {
  return (
    <Link
      href={`/works/${work.id}`}
      className="group flex flex-col gap-3 border-l-2 border-accent bg-surface p-5 transition-colors hover:bg-line/40"
    >
      <p className="text-sm font-medium text-accent">{work.award}</p>
      <h3 className="text-xl font-bold text-fg group-hover:underline group-hover:underline-offset-4">{work.title}</h3>
      {work.summary && <p className="text-[15px] leading-relaxed text-fg">{work.summary}</p>}
      <div className="mt-auto flex flex-col gap-2 pt-2">
        <Meta work={work} />
        {work.techList.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {work.techList.slice(0, 5).map((t) => (
              <li key={t} className="rounded border border-line px-2 py-0.5 font-mono text-xs text-dim">
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}

function WorkRow({ work }: { work: WorkView }) {
  return (
    <li>
      <Link
        href={`/works/${work.id}`}
        className="group grid gap-1 border-b border-line py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6"
      >
        <div className="min-w-0">
          <h3 className="font-bold text-fg group-hover:text-accent">{work.title}</h3>
          {work.summary && <p className="mt-1 line-clamp-2 text-sm text-dim">{work.summary}</p>}
        </div>
        <div className="text-sm text-dim sm:text-right">
          <p>{work.period}</p>
          <p>{work.team}</p>
        </div>
      </Link>
    </li>
  );
}

export default async function Page() {
  const { works, skills, about, timelines } = await getPortfolio();
  const views = works.map(toWorkView);
  const featured = views.filter((w) => w.award);
  const others = views.filter((w) => !w.award);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    alternateName: profile.handle,
    url: "https://portfolio.dice-ke.tech",
    affiliation: "大阪工業大学",
    sameAs: [profile.links.github, profile.links.x],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto flex max-w-5xl flex-col gap-24 px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
        {/* 自己紹介 */}
        <section aria-labelledby="hero" className="flex flex-col gap-5">
          <p className="text-sm text-dim">{profile.affiliation}</p>
          <h1 id="hero" className="font-mono text-5xl font-bold leading-tight text-fg sm:text-6xl">
            {profile.name}
            <span className="ml-3 text-2xl text-dim sm:text-3xl">/ {profile.handle}</span>
          </h1>
          <p className="max-w-[40ch] text-lg leading-relaxed text-fg">{profile.tagline}</p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <AskButton />
            <a
              href={profile.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-line px-4 py-2 text-sm text-fg hover:border-dim"
            >
              GitHub
            </a>
          </div>
        </section>

        {/* 作品 */}
        <section aria-labelledby="works">
          <SectionHeading id="works" title="作品" note={`${works.length}件。受賞作を先に載せています。`} />
          {featured.length > 0 && (
            <div className="mb-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((w) => (
                <FeaturedWork key={w.id} work={w} />
              ))}
            </div>
          )}
          {others.length > 0 && (
            <ul className="border-t border-line">
              {others.map((w) => (
                <WorkRow key={w.id} work={w} />
              ))}
            </ul>
          )}
          {works.length === 0 && <p className="text-dim">作品データを読み込めませんでした。</p>}
        </section>

        {/* 経歴 */}
        <section aria-labelledby="about" className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="min-w-0">
            <SectionHeading id="about" title="経歴" />
            {about.content ? <MarkdownRenderer content={about.content} /> : null}
          </div>
          <ol className="flex flex-col border-l border-line">
            {sortTimeline(timelines).map((t) => (
              <li key={t.id} className="relative pb-6 pl-5 last:pb-0">
                <span aria-hidden className="absolute -left-[4.5px] top-2 h-2 w-2 rounded-full bg-accent" />
                <p className="font-mono text-xs text-dim">{t.event_date}</p>
                <p className="font-medium text-fg">{t.title}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* スキル */}
        <section aria-labelledby="skills">
          <SectionHeading id="skills" title="スキル" />
          <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {groupSkills(skills).map(([cat, list]) => (
              <div key={cat}>
                <dt className="mb-2 text-sm text-dim">{cat}</dt>
                <dd className="flex flex-wrap gap-2">
                  {list.map((s) => (
                    <span key={s.id} className="rounded border border-line px-2.5 py-1 font-mono text-sm text-fg">
                      {s.name}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 連絡先 */}
        <section aria-labelledby="contact">
          <SectionHeading id="contact" title="連絡先" />
          <p className="max-w-[60ch] text-fg">
            ご連絡は X の DM でお気軽にどうぞ。作品のコードは GitHub で公開しています。
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={profile.links.x}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-fg px-4 py-2 text-sm font-medium text-bg hover:opacity-90"
            >
              X で連絡する
            </a>
            <a
              href={profile.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-line px-4 py-2 text-sm text-fg hover:border-dim"
            >
              GitHub を見る
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
