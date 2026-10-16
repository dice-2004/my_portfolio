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

const HELP = [
  "whoami         自己紹介",
  "ls works       作品の一覧（★は受賞作）",
  "cat awards     受賞歴",
  "skills         スキル",
  "open <番号>    作品ページを開く（例: open 1）",
  "clear          画面を消す",
  "exit           パネルを閉じる",
  "",
  "それ以外の文章は AI への質問として扱います（例: どんなチーム開発をしてきた？）。",
].join("\n");

function pad(s: string, n: number): string {
  // 全角は2桁として数える
  const w = [...s].reduce((a, c) => a + (c.charCodeAt(0) > 0xff ? 2 : 1), 0);
  return s + " ".repeat(Math.max(1, n - w));
}

export function runCommand(raw: string, data: Portfolio): CommandResult {
  const [cmd, ...rest] = raw.trim().split(/\s+/);
  const arg = rest.join(" ");
  const works = data.works.map(toWorkView);

  switch (cmd.toLowerCase()) {
    case "help":
    case "?":
      return out(HELP);

    case "whoami":
      return out(`${profile.name} (${profile.handle})\n${profile.affiliation}\n${profile.tagline}`);

    case "ls":
      if (arg && arg !== "works") return err(`ls: ${arg}: そのような項目はありません（ls works を試してください）`);
      if (works.length === 0) return err("作品データを読み込めませんでした。");
      return out(
        works
          .map((w, i) => `${String(i + 1).padStart(2, " ")}  ${w.award ? "★" : " "} ${pad(w.title, 30)}${w.period}`)
          .join("\n") + "\n\nopen <番号> で作品ページを開きます。",
      );

    case "cat": {
      if (arg !== "awards") return err(`cat: ${arg || "(なし)"}: そのような項目はありません（cat awards を試してください）`);
      const awarded = works.filter((w) => w.award);
      if (awarded.length === 0) return out("受賞歴のデータがありません。");
      return out(awarded.map((w) => `${pad(w.award ?? "", 44)}${w.title}`).join("\n"));
    }

    case "skills": {
      if (data.skills.length === 0) return out("スキルのデータがありません。");
      const byCat = new Map<string, string[]>();
      for (const s of data.skills) byCat.set(s.category || "その他", [...(byCat.get(s.category || "その他") ?? []), s.name]);
      return out([...byCat].map(([c, names]) => `${pad(c, 12)}${names.join(", ")}`).join("\n"));
    }

    case "open": {
      const n = Number(arg);
      const target = Number.isInteger(n) && n >= 1 ? works[n - 1] : works.find((w) => w.title.toLowerCase() === arg.toLowerCase());
      if (!target) return err(`open: ${arg || "(なし)"} が見つかりません。ls works で番号を確認してください。`);
      return { lines: [{ kind: "out", text: `→ ${target.title} を開きます` }], navigate: `/works/${target.id}` };
    }

    case "clear":
      return { lines: [], clear: true };

    case "exit":
      return { lines: [], close: true };

    default:
      return { lines: [], ask: raw.trim() };
  }
}
