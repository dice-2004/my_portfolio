import React from 'react';
import HomeClient from './HomeClient';

interface Work { id: number; title: string; description: string; image_url: string; github_url: string; }
interface Skill { id: number; name: string; category: string; proficiency: number; }
interface About { id: number; content: string; }
interface Timeline { id: number; title: string; description: string; event_date: string; category: string; display_order: number; }

async function getHomeData() {
  const baseUrl = process.env.NODE_ENV === 'production' ? 'http://backend:8080' : 'http://localhost:8031';
  
  const fetcher = async (path: string) => {
    try {
      const res = await fetch(`${baseUrl}/api/${path}`, { 
        next: { revalidate: 60 } // 60秒ごとにバックグラウンドでキャッシュ再生成
      });
      if (!res.ok) return path === "about" ? { content: "" } : [];
      return await res.json();
    } catch (e) {
      console.error(`SSR Fetch error on ${path}:`, e);
      return path === "about" ? { content: "" } : [];
    }
  };

  const [works, skills, about, timelines] = await Promise.all([
    fetcher("works"), fetcher("skills"), fetcher("about"), fetcher("timeline")
  ]);

  return {
    works: Array.isArray(works) ? works : [],
    skills: Array.isArray(skills) ? skills : [],
    about: about || { content: "" },
    timelines: Array.isArray(timelines) ? timelines : []
  };
}

export default async function Page() {
  const data = await getHomeData();

  // JSON-LD Structured Data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Daisuke",
    "url": "https://portfolio.dice-ke.tech",
    "jobTitle": "Full Stack Developer",
    "description": "Digital Archive & High-Performance Engineering Portfolio",
    "sameAs": [
        "https://x.com/_dice_ke"
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient data={data} />
    </>
  );
}
