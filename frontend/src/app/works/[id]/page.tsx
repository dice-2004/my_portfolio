import React from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import WorkDetailClient from './WorkDetailClient';

interface Work {
  id: number;
  title: string;
  description: string;
  image_url: string;
  github_url: string;
  period: string;
  team: string;
  tech: string;
  display_order: number;
  created_at: string;
}

// サーバーサイドでのフェッチ用関数
async function getWorkData(id: string): Promise<Work | null> {
  try {
    // Docker内部ネットワークではサービス名 'backend' で通信する
    const baseUrl = process.env.NODE_ENV === 'production' ? 'http://backend:8080' : 'http://localhost:8031';
    const res = await fetch(`${baseUrl}/api/works/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Server-side fetch error:", err);
    return null;
  }
}

// SEO用メタデータの動的生成
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const work = await getWorkData(id);

  if (!work) {
    return {
      title: 'Specimen Not Found',
      robots: { index: false }
    };
  }

  return {
    title: `${work.title} | Technical Archive`,
    description: work.description.substring(0, 160).replace(/[#*`]/g, ''),
    openGraph: {
      title: `${work.title} - Digital Archive`,
      description: work.description.substring(0, 160).replace(/[#*`]/g, ''),
      type: 'article',
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const work = await getWorkData(id);

  return <WorkDetailClient work={work} id={id} />;
}
