import { renderOgImage } from "@/lib/og";
import { profile } from "@/content/profile";

export const alt = "Daisuke (dice) のポートフォリオ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({
    eyebrow: profile.affiliation,
    title: `${profile.name} (${profile.handle})`,
    description: profile.tagline,
  });
}
