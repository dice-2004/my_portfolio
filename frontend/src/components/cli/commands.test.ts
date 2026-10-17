import { describe, expect, it } from "vitest";
import type { Portfolio, Work } from "@/lib/portfolio";
import { COMMANDS, runCommand, suggest } from "./commands";

const work = (id: number, title: string, award = false): Work => ({
  id,
  title,
  description: award ? "🏆 **AWARD:** 最優秀賞\n\n### Concept\n概要" : "### Concept\n概要",
  image_url: "",
  github_url: "",
  period: "2025",
  team: "",
  tech: "",
  display_order: id,
  created_at: "",
});

const data: Portfolio = {
  works: [work(10, "Alpha", true), work(20, "Beta")],
  skills: [
    { id: 1, name: "Go", category: "言語", proficiency: 0 },
    { id: 2, name: "Python", category: "言語", proficiency: 0 },
    { id: 3, name: "Docker", category: "", proficiency: 0 },
  ],
  about: { content: "" },
  timelines: [],
};

const text = (raw: string) => runCommand(raw, data).lines.map((l) => l.text).join("\n");

describe("suggest", () => {
  it("/ で始まる入力に前方一致するコマンドを出す", () => {
    expect(suggest("/w").map((c) => c.name)).toEqual(["/whoami", "/works"]);
    expect(suggest("/").length).toBe(COMMANDS.length);
  });

  it("/ で始まらない入力や、引数を打ち始めたら出さない", () => {
    expect(suggest("works")).toEqual([]);
    expect(suggest("/open ")).toEqual([]);
  });
});

describe("runCommand", () => {
  it("/ で始まらない文章は AI への質問にする", () => {
    expect(runCommand("  どんな研究をしていますか  ", data)).toEqual({ lines: [], ask: "どんな研究をしていますか" });
  });

  it("help は / なしでも一覧を出し、AI には送らない", () => {
    const r = runCommand("help", data);
    expect(r.ask).toBeUndefined();
    expect(text("help")).toContain("/open <n>");
  });

  it("/works は番号と受賞の印を付けて並べる", () => {
    const out = text("/works");
    expect(out).toContain(" 1  ★ Alpha");
    expect(out).toContain(" 2    Beta");
  });

  it("/awards は受賞作だけを出す", () => {
    expect(text("/awards")).toBe("★ Alpha  · 最優秀賞");
  });

  it("/skills は分類ごとにまとめ、分類が空なら「その他」にする", () => {
    expect(text("/skills")).toBe("言語\n  Go, Python\n\nその他\n  Docker");
  });

  it("/open は番号か作品名で作品ページへ移る", () => {
    expect(runCommand("/open 2", data).navigate).toBe("/works/20");
    expect(runCommand("/open alpha", data).navigate).toBe("/works/10");
  });

  it("/open で見つからないときはエラーにする", () => {
    const r = runCommand("/open 9", data);
    expect(r.navigate).toBeUndefined();
    expect(r.lines[0].kind).toBe("err");
  });

  it("コマンド名の大文字小文字は区別しない", () => {
    expect(runCommand("/CLEAR", data).clear).toBe(true);
    expect(runCommand("/exit", data).close).toBe(true);
  });

  it("無いコマンドはエラーにする", () => {
    const r = runCommand("/rm -rf", data);
    expect(r.lines[0]).toMatchObject({ kind: "err" });
    expect(r.lines[0].text).toContain("/rm");
  });
});
