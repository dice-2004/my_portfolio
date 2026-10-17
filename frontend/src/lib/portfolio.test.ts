import { describe, expect, it } from "vitest";
import { splitTech, toWorkView, type Work } from "./portfolio";

const base: Work = {
  id: 1,
  title: "テスト作品",
  description: "",
  image_url: "",
  github_url: "",
  period: "2025.05",
  team: "4人",
  tech: "",
  display_order: 1,
  created_at: "",
};

describe("splitTech", () => {
  it("括弧の中のカンマでは区切らない", () => {
    expect(splitTech("Python (OpenCV, MediaPipe), C++/Arduino")).toEqual(["Python (OpenCV, MediaPipe)", "C++/Arduino"]);
  });

  it("全角の括弧と読点も扱う", () => {
    expect(splitTech("Go（Gin、SQLite）、Next.js")).toEqual(["Go（Gin、SQLite）", "Next.js"]);
  });

  it("空の項目は捨てる", () => {
    expect(splitTech(" , Go,, ")).toEqual(["Go"]);
    expect(splitTech("")).toEqual([]);
  });
});

describe("toWorkView", () => {
  const description = [
    "🏆 **AWARD:** サイバーエージェント賞",
    "",
    "### Spec Sheet",
    "- **Period:** 2025.05",
    "",
    "### Concept",
    "寝落ちを防ぐアプリ。",
    "",
    "### Background & Problem",
    "課題の説明。",
    "",
    "### Solution",
    "解決策の説明。",
  ].join("\n");

  it("受賞・概要・本文に分け、見出しを日本語にする", () => {
    const v = toWorkView({ ...base, description, tech: "Swift, Python (FastAPI)" });
    expect(v.award).toBe("サイバーエージェント賞");
    expect(v.summary).toBe("寝落ちを防ぐアプリ。");
    expect(v.body).toBe("### 背景・課題\n課題の説明。\n\n### 解決策\n解決策の説明。");
    expect(v.body).not.toContain("Spec Sheet");
    expect(v.techList).toEqual(["Swift", "Python (FastAPI)"]);
  });

  it("見出しの無い説明はそのまま本文にする", () => {
    const v = toWorkView({ ...base, description: "自由に書いた説明。" });
    expect(v.award).toBeNull();
    expect(v.summary).toBe("");
    expect(v.body).toBe("自由に書いた説明。");
  });
});
