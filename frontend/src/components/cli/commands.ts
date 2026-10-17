// CLI パネルの即答コマンド。API を呼ばずに、ページに載っているデータだけで答える。
import { profile } from "@/content/profile";
import { toWorkView, type Portfolio } from "@/lib/portfolio";

export type Line = {
  kind: "cmd" | "out" | "err" | "ai";
  text: string;
  sources?: { title: string; url?: string }[];
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

/** 入力中の文字列に合うコマンド。"/" で始まり、まだ引数を打っていないときだけ出す。 */
export function suggest(input: string): typeof COMMANDS {
  if (!input.startsWith("/") || /\s/.test(input)) return [];
  const q = input.toLowerCase();
  return COMMANDS.filter((c) => c.name.startsWith(q));
}

const HELP = [
  ...COMMANDS.map((c) => `${pad(c.usage ?? c.name, 15)}${c.desc}`),
  "",
  "/ で始まらない文章は AI への質問として扱います（例: どんなチーム開発をしてきた？）。",
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
