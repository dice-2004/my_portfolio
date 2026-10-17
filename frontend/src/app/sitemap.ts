import type { MetadataRoute } from "next";
import { getPortfolio } from "@/lib/portfolio";

const SITE = "https://portfolio.dice-ke.tech";

// 作品の一覧はバックエンドから取る。取れないとき（ビルド時など）はトップだけを返し、60 秒ごとに作り直す。
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { works } = await getPortfolio();
  return [
    { url: SITE, changeFrequency: "weekly", priority: 1 },
    ...works.map((w) => ({ url: `${SITE}/works/${w.id}`, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
