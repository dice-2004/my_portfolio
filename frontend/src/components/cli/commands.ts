// CLI パネルの即答コマンド。API を呼ばずに、ページに載っているデータだけで答える。
import { profile } from "@/content/profile";
import { toWorkView, type Portfolio } from "@/lib/portfolio";

export type Line = {
  kind: "cmd" | "out" | "err" | "ai";
  text: string;
  sources?: { title: string; url?: string }[];
  /** Ctrl+C で途中で止めた回答 */
  stopped?: boolean;
};

export interface CommandResult {
  lines: Line[];
  clear?: boolean;
  close?: boolean;
  navigate?: string;
  /** コマンドではないので AI に質問する */
  ask?: string;
}

const out = (text: string): CommandResult => ({ lines: [{ kind: "out", text }] });
const err = (text: string): CommandResult => ({ lines: [{ kind: "err", text }] });

// 1 列目は ASCII だけにして、スペースで桁を揃える（全角の幅はフォント次第で揃わないため）
function pad(s: string, n: number): string {
  return s + " ".repeat(Math.max(1, n - s.length));
}

/** スラッシュコマンドの一覧。入力欄の候補表示と /help の両方で使う。 */
export const COMMANDS: { name: string; usage?: string; desc: string }[] = [
  { name: "/help", desc: "コマンドの一覧" },
  { name: "/whoami", desc: "自己紹介" },
  { name: "/works", desc: "作品の一覧（★は受賞作）" },
  { name: "/open", usage: "/open <n>", desc: "n 番の作品ページを開く（例: /open 1）" },
  { name: "/awards", desc: "受賞歴" },
  { name: "/skills", desc: "スキル" },
  { name: "/clear", desc: "画面と会話を消す" },
  { name: "/exit", desc: "パネルを閉じる" },
];

/** 入力欄の上に出す候補。選ぶと入力欄が insert になり、run なら続けて実行する。 */
export interface Suggestion {
  label: string;
  desc: string;
  insert: string;
  run?: boolean;
}

const MAX_SUGGEST = 8;

/**
 * 入力中の文字列に合う候補。
 * - "/" で始まり引数をまだ打っていない → コマンド
 * - "/open " のあと → 作品（番号かタイトルの一部で絞る）
 * - 末尾の語が "@" で始まる → 作品の名前（質問の中で作品を指すため）
 */
export function suggest(input: string, data: Portfolio): Suggestion[] {
  if (input.startsWith("/") && !/\s/.test(input)) {
    const q = input.toLowerCase();
    return COMMANDS.filter((c) => c.name.startsWith(q)).map((c) => ({
      label: c.usage ?? c.name,
      desc: c.desc,
      insert: c.name + (c.usage ? " " : ""),
      run: !c.usage,
    }));
  }

  const open = input.match(/^\/open\s+(\S*)$/i);
  if (open) {
    const q = open[1].toLowerCase();
    return data.works
      .map((w, i) => ({ n: String(i + 1), title: w.title }))
      .filter((w) => !q || w.n.startsWith(q) || w.title.toLowerCase().includes(q))
      .slice(0, MAX_SUGGEST)
      .map((w) => ({ label: `/open ${w.n}`, desc: w.title, insert: `/open ${w.n}`, run: true }));
  }

  const at = input.match(/(^|\s)@([^\s@]*)$/);
  if (at) {
    const q = at[2].toLowerCase();
    const head = input.slice(0, input.length - at[2].length - 1);
    return data.works
      .filter((w) => w.title.toLowerCase().includes(q))
      .slice(0, MAX_SUGGEST)
      .map((w) => ({ label: `@${w.title}`, desc: w.period || "作品", insert: `${head}@${w.title} ` }));
  }
  return [];
}

/** 文中の「@作品名」を探すための正規表現。長い名前から順に当てる。 */
export function mentionPattern(data: Portfolio): RegExp | null {
  const titles = data.works.map((w) => w.title).filter(Boolean);
  if (titles.length === 0) return null;
  const esc = titles.sort((a, b) => b.length - a.length).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`(@(?:${esc.join("|")}))`, "g");
}

const HELP = [
  ...COMMANDS.map((c) => `${pad(c.usage ?? c.name, 15)}${c.desc}`),
  "",
  "/ で始まらない文章は AI への質問として扱います（例: どんなチーム開発をしてきた？）。",
  "@ を打つと作品の名前を選んで質問に入れられます（例: @作品名 の工夫は？）。",
  "",
  `${pad("Tab", 15)}候補を補完する（/open のあとなら作品の番号）`,
  `${pad("Shift+Enter", 15)}改行する`,
  `${pad("Up / Down", 15)}前に入力した文を呼び出す`,
  `${pad("Ctrl+C", 15)}回答を止める / 入力を消す`,
  `${pad("Ctrl+L", 15)}画面を消す（会話は続く）`,
  `${pad("Esc", 15)}パネルを閉じる`,
].join("\n");

export function runCommand(raw: string, data: Portfolio): CommandResult {
  const text = raw.trim();
  // 「help」だけは / なしでも受け付ける（AI に送ると回数を無駄にするため）
  if (text === "help" || text === "?") return out(HELP);
  if (!text.startsWith("/")) return { lines: [], ask: text };

  const [cmd, ...rest] = text.split(/\s+/);
  const arg = rest.join(" ");
  const works = data.works.map(toWorkView);

  switch (cmd.toLowerCase()) {
    case "/help":
      return out(HELP);

    case "/whoami":
      return out(`${profile.name} (${profile.handle})\n${profile.affiliation}\n${profile.tagline}`);

    case "/works":
      if (works.length === 0) return err("作品データを読み込めませんでした。");
      return out(
        works
          .map((w, i) => `${String(i + 1).padStart(2, " ")}  ${w.award ? "★" : " "} ${w.title}${w.period ? `  · ${w.period}` : ""}`)
          .join("\n") + "\n\n/open <n> で n 番の作品ページを開きます。",
      );

    case "/awards": {
      const awarded = works.filter((w) => w.award);
      if (awarded.length === 0) return out("受賞歴のデータがありません。");
      return out(awarded.map((w) => `★ ${w.title}  · ${w.award}`).join("\n"));
    }

    case "/skills": {
      if (data.skills.length === 0) return out("スキルのデータがありません。");
      const byCat = new Map<string, string[]>();
      for (const s of data.skills) byCat.set(s.category || "その他", [...(byCat.get(s.category || "その他") ?? []), s.name]);
      return out([...byCat].map(([c, names]) => `${c}\n  ${names.join(", ")}`).join("\n\n"));
    }

    case "/open": {
      const n = Number(arg);
      const target = Number.isInteger(n) && n >= 1 ? works[n - 1] : works.find((w) => w.title.toLowerCase() === arg.toLowerCase());
      if (!target) return err(`/open: ${arg || "(なし)"} が見つかりません。/works で番号を確認してください。`);
      return { lines: [{ kind: "out", text: `→ ${target.title} を開きます` }], navigate: `/works/${target.id}` };
    }

    case "/clear":
      return { lines: [], clear: true };

    case "/exit":
      return { lines: [], close: true };

    default:
      return err(`${cmd}: そのようなコマンドはありません。/help で一覧を表示します。`);
  }
}
