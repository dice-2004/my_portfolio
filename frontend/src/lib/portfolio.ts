// バックエンド API の型と取得処理、作品データの整形をまとめたモジュール。
// サーバーコンポーネント（page / layout）から呼ぶ。

export interface Work {
  id: number;
  title: string;
  description: string;
  image_url: string;
  github_url: string;
  period: string;
  team: string;
  tech: string;
  display_order: number;
  created_at: string;
}

export interface Skill {
  id: number;
  name: string;
  category: string;
  proficiency: number;
  display_order?: number;
}

export interface About {
  id?: number;
  content: string;
}

export interface Timeline {
  id: number;
  title: string;
  description: string;
  event_date: string;
  category: string;
  display_order: number;
}

export interface Portfolio {
  works: Work[];
  skills: Skill[];
  about: About;
  timelines: Timeline[];
}

// Docker 内では サービス名 backend で通信する。開発時は compose が公開している 8031 番。
// BACKEND_URL を書けばそちらを使う（docker-compose.dev.yml の開発サーバーなど）。
export const API_BASE =
  process.env.BACKEND_URL ??
  (process.env.NODE_ENV === "production" ? "http://backend:8080" : "http://localhost:8031");

async function getJSON<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}/api/${path}`, { next: { revalidate: 60 } });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch (e) {
    console.error(`fetch error on /api/${path}:`, e);
    return fallback;
  }
}

export async function getPortfolio(): Promise<Portfolio> {
  const [works, skills, about, timelines] = await Promise.all([
    getJSON<Work[]>("works", []),
    getJSON<Skill[]>("skills", []),
    getJSON<About>("about", { content: "" }),
    getJSON<Timeline[]>("timeline", []),
  ]);
  return {
    works: Array.isArray(works) ? [...works].sort((a, b) => a.display_order - b.display_order) : [],
    skills: Array.isArray(skills) ? skills : [],
    about: about && typeof about.content === "string" ? about : { content: "" },
    timelines: Array.isArray(timelines) ? timelines : [],
  };
}

export async function getWork(id: string): Promise<Work | null> {
  if (!/^\d+$/.test(id)) return null;
  return getJSON<Work | null>(`works/${id}`, null);
}

// ---- 作品説明（seeds/works_unified.md から生成された Markdown）の分解 ----

export interface WorkView extends Work {
  award: string | null;
  summary: string;
  body: string;
  techList: string[];
}

const AWARD_RE = /🏆 \*\*AWARD:\*\*\s*(.+)/;
const SECTION_RE = /^###\s+(.+)$/gm;

function sections(md: string): Record<string, string> {
  const out: Record<string, string> = {};
  const heads = [...md.matchAll(SECTION_RE)];
  heads.forEach((h, i) => {
    const start = (h.index ?? 0) + h[0].length;
    const end = i + 1 < heads.length ? heads[i + 1].index ?? md.length : md.length;
    out[h[1].trim()] = md.slice(start, end).trim();
  });
  return out;
}

// 表示用の日本語見出し。元データの英語見出しを置き換える。
const HEADING_JA: Record<string, string> = {
  "Background & Problem": "背景・課題",
  Solution: "解決策",
  "Laboratory Notes (Role & Effort)": "担当・工夫した点",
  Remarks: "備考",
};

export function toWorkView(work: Work): WorkView {
  const desc = work.description ?? "";
  const award = desc.match(AWARD_RE)?.[1]?.trim() ?? null;
  const sec = sections(desc);
  const summary = sec["Concept"] ?? "";

  // 本文は Spec Sheet（period/team/tech と重複）と Concept（summary として別表示）を除いたもの。
  const bodyParts = Object.entries(sec)
    .filter(([k]) => k !== "Spec Sheet" && k !== "Concept")
    .map(([k, v]) => `### ${HEADING_JA[k] ?? k}\n${v}`);
  // 見出しの無い自由記述（管理画面で手書きされたもの等）はそのまま本文にする。
  const body = Object.keys(sec).length > 0 ? bodyParts.join("\n\n") : desc.replace(AWARD_RE, "").trim();

  return { ...work, award, summary, body, techList: splitTech(work.tech || "") };
}

// "Python (OpenCV, MediaPipe), C++/Arduino" → ["Python (OpenCV, MediaPipe)", "C++/Arduino"]
// 括弧の中のカンマでは区切らない。
export function splitTech(tech: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of tech) {
    if (ch === "(" || ch === "（") depth++;
    if (ch === ")" || ch === "）") depth = Math.max(0, depth - 1);
    if ((ch === "," || ch === "、") && depth === 0) {
      if (cur.trim()) out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
