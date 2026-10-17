import { renderOgImage } from "@/lib/og";
import { getWork, toWorkView } from "@/lib/portfolio";

export const alt = "作品の紹介";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const work = await getWork(id);
  if (!work) return renderOgImage({ title: "作品が見つかりません" });
  const w = toWorkView(work);
  return renderOgImage({ eyebrow: w.award ?? undefined, title: w.title, description: w.summary });
}
