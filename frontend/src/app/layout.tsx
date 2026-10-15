import type { Metadata } from "next";
import { IBM_Plex_Sans_JP, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CliProvider } from "@/components/cli/CliContext";
import CliPanel from "@/components/cli/CliPanel";
import SiteShell from "@/components/SiteShell";
import { getPortfolio } from "@/lib/portfolio";

const plexJp = IBM_Plex_Sans_JP({
  variable: "--font-plex-jp",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

const SITE_DESCRIPTION =
  "大阪工業大学 情報系の学生エンジニア Daisuke（dice）のポートフォリオ。ハッカソンでの受賞作から、C言語の対戦AI、Next.js のWebアプリまで。";

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
  // CLI パネルの即答コマンド（ls works など）用。page と同じ fetch なので Next.js のキャッシュで重複しない。
  const portfolio = await getPortfolio();

  return (
    <html lang="ja" className={`${plexJp.variable} ${jetbrains.variable} antialiased`}>
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
