import type { Metadata } from "next";
// フォントは npm パッケージから読み、サイト自身から配る。ビルド時に Google Fonts へ取りに行かないので、
// ネットワークが不安定なサーバーでもビルドが失敗しない。
import "@fontsource/ibm-plex-sans-jp/400.css";
import "@fontsource/ibm-plex-sans-jp/500.css";
import "@fontsource/ibm-plex-sans-jp/700.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "@fontsource/jetbrains-mono/latin-700.css";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CliProvider } from "@/components/cli/CliContext";
import CliPanel from "@/components/cli/CliPanel";
import SiteShell from "@/components/SiteShell";
import { getPortfolio } from "@/lib/portfolio";

const SITE_DESCRIPTION =
  "大阪工業大学 情報系の学生エンジニア Daisuke（dice）のポートフォリオ。ハッカソンでの受賞作や制作物、イベント運営や研究の経歴を紹介しています。";

export const metadata: Metadata = {
  metadataBase: new URL("https://portfolio.dice-ke.tech"),
  title: {
    default: "Daisuke (dice) のポートフォリオ",
    template: "%s | dice",
  },
  description: SITE_DESCRIPTION,
  authors: [{ name: "Daisuke" }],
  creator: "Daisuke",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://portfolio.dice-ke.tech",
    title: "Daisuke (dice) のポートフォリオ",
    description: SITE_DESCRIPTION,
    siteName: "dice portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Daisuke (dice) のポートフォリオ",
    description: SITE_DESCRIPTION,
    creator: "@_dice_ke",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/dice.svg" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // CLI パネルの即答コマンド（/works など）用。page と同じ fetch なので Next.js のキャッシュで重複しない。
  const portfolio = await getPortfolio();

  return (
    <html lang="ja" className="antialiased" data-scroll-behavior="smooth">
      <body className="min-h-dvh">
        <CliProvider>
          <SiteShell>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </SiteShell>
          <CliPanel portfolio={portfolio} />
        </CliProvider>
      </body>
    </html>
  );
}
