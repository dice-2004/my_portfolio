// SNS で共有したときの画像（OG 画像）を作る共通部品。トップと作品ページの opengraph-image から使う。
// 画像はサイトと同じ配色で、左上に CLI パネルと同じドット絵を置く。
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SPRITES } from "@/components/cli/sprites";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// globals.css のデザイントークンと同じ値
const C = { bg: "#101311", fg: "#dce5de", dim: "#8f9c95", line: "#2a322d", accent: "#e9b44c" };

// IBM Plex Sans JP は @fontsource で文字の範囲ごとに 120 個ほどのファイルに分かれている。
// 画像に出す文字を含むファイルだけを CSS の unicode-range から探して読む（画像の生成は WOFF2 に非対応なので WOFF）。
// 同じフォント名で複数のファイルを渡すと太さが混ざるので、ファイルごとに別の名前を付けて font-family に並べる。
const FONT_DIR = join(process.cwd(), "node_modules/@fontsource/ibm-plex-sans-jp");

type Range = [number, number];
type Face = { file: string; ranges: Range[] };

function parseFaces(css: string): Face[] {
  const faces: Face[] = [];
  for (const block of css.split("@font-face").slice(1)) {
    const file = block.match(/url\(\.\/files\/([^)]+\.woff)\)/)?.[1];
    const range = block.match(/unicode-range:\s*([^;]+);/)?.[1];
    if (!file || !range) continue;
    const ranges = range.split(",").map((r): Range => {
      const [a, b] = r.trim().replace(/^U\+/i, "").split("-");
      return [parseInt(a, 16), parseInt(b ?? a, 16)];
    });
    faces.push({ file, ranges });
  }
  return faces;
}

async function loadFonts(text: string, weight: 400 | 700) {
  const css = await readFile(join(FONT_DIR, `${weight}.css`), "utf8");
  const codes = new Set([...text].map((ch) => ch.codePointAt(0) ?? 0));
  const used = parseFaces(css).filter((f) =>
    [...codes].some((c) => f.ranges.some(([a, b]) => c >= a && c <= b)),
  );
  const fonts = await Promise.all(
    used.map(async (f, i) => ({
      name: `plex-${weight}-${i}`,
      data: await readFile(join(FONT_DIR, "files", f.file)),
      weight,
      style: "normal" as const,
    })),
  );
  return { fonts, family: fonts.map((f) => f.name).join(", ") };
}

function Sprite() {
  const s = SPRITES[0];
  if (!s) return null;
  const dot = 5;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {s.frames[0].map((row, y) => (
        <div key={y} style={{ display: "flex" }}>
          {[...row].map((ch, x) => (
            <div key={x} style={{ width: dot, height: dot, background: s.palette[ch] ?? "transparent" }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export interface OgContent {
  /** タイトルの上に小さく出す行（受賞歴など） */
  eyebrow?: string;
  title: string;
  description?: string;
}

export async function renderOgImage({ eyebrow, title, description }: OgContent) {
  const footer = "dice のポートフォリオ";
  const host = "portfolio.dice-ke.tech";
  const desc = description && description.length > 90 ? `${description.slice(0, 89)}…` : description;
  const bold = `${eyebrow ?? ""}${title}`;
  const regular = `${desc ?? ""}${footer}${host}`;
  const [b, r] = await Promise.all([loadFonts(bold, 700), loadFonts(regular, 400)]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: C.bg,
          color: C.fg,
          fontFamily: r.family,
          padding: "56px 72px",
        }}
      >
        <Sprite />
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 20 }}>
          {eyebrow && (
            <div
              style={{
                display: "flex",
                fontSize: 30,
                fontFamily: b.family,
                fontWeight: 700,
                color: C.accent,
                borderLeft: `6px solid ${C.accent}`,
                paddingLeft: 18,
              }}
            >
              {eyebrow}
            </div>
          )}
          <div style={{ display: "flex", fontSize: title.length > 24 ? 60 : 76, fontFamily: b.family, fontWeight: 700, lineHeight: 1.25 }}>
            {title}
          </div>
          {desc && (
            <div style={{ display: "flex", fontSize: 30, lineHeight: 1.6, color: C.fg, maxWidth: 1000 }}>{desc}</div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: `2px solid ${C.line}`,
            paddingTop: 24,
            fontSize: 26,
            color: C.dim,
          }}
        >
          <span>{footer}</span>
          <span>{host}</span>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: [...b.fonts, ...r.fonts] },
  );
}
