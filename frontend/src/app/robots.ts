import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    // /api/ は AI チャットなどのバックエンドなので検索エンジンには読ませない
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: "https://portfolio.dice-ke.tech/sitemap.xml",
  };
}
