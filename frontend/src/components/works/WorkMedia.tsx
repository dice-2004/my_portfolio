import { youtubeEmbed } from "@/lib/portfolio";

// 作品詳細のデモ動画と画像。どちらも無ければ何も出さない。
export default function WorkMedia({ title, images, video }: { title: string; images: string[]; video: string }) {
  if (!video && images.length === 0) return null;
  const embed = video ? youtubeEmbed(video) : null;
  const isFile = /\.(mp4|webm)$/i.test(video);

  return (
    <section aria-label="画像と動画" className="flex flex-col gap-4">
      {embed && (
        <iframe
          src={embed}
          title={`${title} のデモ動画`}
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="aspect-video w-full rounded border border-line"
        />
      )}
      {!embed && isFile && (
        <video src={video} controls preload="metadata" className="aspect-video w-full rounded border border-line bg-panel">
          <a href={video}>デモ動画をダウンロード</a>
        </video>
      )}
      {video && !embed && !isFile && (
        <a
          href={video}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit rounded border border-line px-3 py-1.5 text-sm text-fg hover:border-dim"
        >
          デモ動画を見る
        </a>
      )}
      {images.length > 0 && (
        <ul className={`grid gap-3 ${images.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {images.map((src, i) => (
            <li key={src}>
              <a href={src} target="_blank" rel="noopener noreferrer" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element -- 画像はバックエンドが配信するので next/image の最適化を通さない */}
                <img
                  src={src}
                  alt={`${title} の画像 ${i + 1}`}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="w-full rounded border border-line object-cover hover:border-dim"
                />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
