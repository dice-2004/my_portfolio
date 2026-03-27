import type { Metadata } from "next";
import { Space_Grotesk, Outfit } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DICE. // Portfolio",
  description: "Precision Engineering & Digital Aesthetics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${spaceGrotesk.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans selection-neon relative">
        <div className="noise" />
        <Header />
        {/* Headerが固定(fixed)なので、上部にパディングを設けてコンテンツが被らないようにします */}
        <main className="flex-grow pt-20 relative z-0">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
