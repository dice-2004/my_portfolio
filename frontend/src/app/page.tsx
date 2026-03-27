"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import GlassCard from '@/components/GlassCard';
import DiceLogo from '@/components/DiceLogo';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { Sparkles, Cpu, ExternalLink, Calendar, Database, Activity, Code2, Layers, ChevronRight, Hash, Terminal } from 'lucide-react';

interface Work { id: number; title: string; description: string; image_url: string; github_url: string; }
interface Skill { id: number; name: string; category: string; proficiency: number; }
interface About { id: number; content: string; }
interface Timeline { id: number; title: string; description: string; event_date: string; category: string; display_order: number; }

export default function Home() {
  const [data, setData] = React.useState<{
    works: Work[],
    skills: Skill[],
    about: About,
    timelines: Timeline[]
  } | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      const fetcher = (path: string) => fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/${path}`).then(res => res.json());
      const [works, skills, about, timelines] = await Promise.all([
        fetcher("works"), fetcher("skills"), fetcher("about"), fetcher("timeline")
      ]);
      setData({ works, skills, about, timelines });
    };
    fetchData();
  }, []);

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-[#07080a] overflow-hidden">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-white/5 border-t-lime-green rounded-full animate-spin" />
        <span className="text-[10px] font-mono text-white/20 tracking-widest uppercase">Initializing_Link</span>
      </div>
    </div>
  );

  const { works, skills, about, timelines } = data;

  return (
    <main className="min-h-screen bg-[#07080a] text-white overflow-x-hidden selection:bg-lime-green selection:text-black font-sans">
      {/* Background System Layers */}
      <div className="fixed inset-0 tech-grid opacity-20 pointer-events-none" />
      <div className="fixed inset-0 noise-bg opacity-[0.05] pointer-events-none mix-blend-soft-light" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(156,225,20,0.05),transparent_60%)]" />

      {/* Frame Decorations */}
      <div className="fixed inset-6 border border-white/5 pointer-events-none hidden md:block z-50">
         <div className="absolute top-0 right-0 p-4 flex gap-4">
            <div className="w-1 h-1 bg-lime-green/40" />
            <div className="w-1 h-1 bg-lime-green/20" />
         </div>
         <div className="absolute bottom-4 left-4 text-[8px] font-mono text-gray-700 tracking-widest uppercase rotate-90 origin-bottom-left">
            Sector_07 // DAISUKE_ARCHIVE
         </div>
      </div>

      <div className="max-w-[1440px] mx-auto relative z-10 px-6 md:px-12 lg:px-16 pt-32 pb-64">
        
        {/* 1. Technical Hero: Refined Scale */}
        <section className="min-h-[70vh] flex flex-col justify-center relative mb-40">
           <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 1.2, ease: "circOut" }}
             className="relative z-10"
           >
              <div className="flex flex-col gap-2 mb-12 animate-fade-in opacity-0 [animation-delay:200ms] [animation-fill-mode:forwards]">
                 <div className="flex items-center gap-4">
                    <span className="h-[1px] w-12 bg-lime-green/50"></span>
                    <span className="text-[10px] font-mono tracking-[0.4em] text-lime-green uppercase">System_Active // 2026_Collection</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
                <div className="lg:col-span-12 relative">
                   <div className="absolute -top-20 -left-12 text-[12vw] font-display font-black text-white/[0.02] select-none pointer-events-none tracking-tighter">
                      DICE_ARCHIVE
                   </div>
                   <h1 className="text-[clamp(4rem,15vw,12rem)] font-display font-black leading-[0.85] tracking-tighter mb-12 flex flex-col items-start translate-x-[-0.05em]">
                     <span className="text-white relative z-10 block overflow-hidden">
                        <span className="block animate-slide-up [animation-delay:400ms]">DICE<span className="inline-block w-4 h-4 md:w-8 md:h-8 bg-lime-green rounded-full ml-4 md:ml-8 animate-pulse"></span></span>
                     </span>
                     <span className="text-lime-green italic relative z-10 block overflow-hidden mt-[-0.1em]">
                        <span className="block animate-slide-up [animation-delay:600ms]">ARCHIVE</span>
                     </span>
                     <span className="text-white/20 relative z-10 block overflow-hidden mt-[-0.1em]">
                        <span className="block animate-slide-up [animation-delay:800ms]">PORTFOLIO.</span>
                     </span>
                   </h1>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-12 mt-20 items-start md:items-center">
                <Link href="/works" className="group relative bg-white text-black px-12 py-6 rounded-full font-display font-black text-xl hover:bg-lime-green transition-all duration-500 overflow-hidden flex items-center gap-6">
                   <span className="relative z-10">実績を検証する</span>
                   <div className="relative z-10 p-2 bg-black rounded-full group-hover:bg-white transition-colors">
                      <Terminal size={20} className="text-white group-hover:text-black transition-colors" />
                   </div>
                   <div className="absolute inset-0 bg-lime-green/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                </Link>
              </div>
           </motion.div>
        </section>

        {/* 2. Structured Content: Information Panes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-64">
            {/* Identification Pane */}
            <div className="lg:col-span-8 group">
               <div className="bg-[#0c0d12] border border-white/10 p-10 md:p-14 rounded-3xl relative overflow-hidden h-full">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] scale-150 rotate-12 pointer-events-none">
                     <Cpu size={160} />
                  </div>
                  <div className="flex items-center gap-4 mb-12">
                     <div className="w-3 h-3 bg-lime-green rounded-full shadow-[0_0_10px_#9CE114]" />
                     <h2 className="text-xl font-display font-black tracking-tight uppercase">Identification: Daisuke</h2>
                  </div>
                  <div className="prose prose-invert prose-lg max-w-none prose-p:text-gray-400 prose-p:leading-[1.8] prose-strong:text-white prose-strong:font-bold">
                    <MarkdownRenderer content={about.content} />
                  </div>
               </div>
            </div>

            {/* Event Timeline Pane */}
            <div className="lg:col-span-4 flex flex-col gap-6">
               <div className="bg-[#0c0d12] border border-white/10 p-8 rounded-3xl flex-1">
                  <h3 className="text-[10px] font-mono text-lime-green mb-8 tracking-[0.4em] uppercase">Chronology_Table</h3>
                  <div className="space-y-6">
                    {timelines.slice(0, 5).map((t) => (
                      <div key={t.id} className="relative pl-6 border-l border-white/5 pb-2 group">
                        <div className="absolute -left-[3.5px] top-0 w-1.5 h-1.5 bg-gray-800 rounded-full group-hover:bg-lime-green transition-colors" />
                        <div className="text-[9px] font-mono text-gray-600 mb-1">{t.event_date}</div>
                        <h4 className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">{t.title}</h4>
                      </div>
                    ))}
                  </div>
               </div>
               <Link href="/contact" className="bg-lime-green p-8 rounded-3xl flex items-center justify-between group hover:rotate-1 transition-transform">
                  <div className="text-black">
                     <h3 className="text-xl font-display font-black uppercase leading-none">Connection</h3>
                     <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-60">連絡を取る</p>
                  </div>
                  <ChevronRight size={32} className="text-black group-hover:translate-x-2 transition-transform" />
               </Link>
            </div>
        </div>

        {/* 3. The Grid Re-imagined: Works as Laboratory Specimens */}
        <section className="mb-64">
           <div className="flex items-end justify-between mb-20">
              <div>
                 <h3 className="text-[10px] font-mono text-lime-green mb-4 tracking-[0.4em] uppercase">Collected_Artifacts</h3>
                 <h2 className="text-5xl md:text-7xl font-display font-black tracking-tighter uppercase whitespace-nowrap">WORKS<span className="text-lime-green">.</span></h2>
              </div>
              <div className="hidden md:block w-96 h-[1px] bg-white/10 mb-5" />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 grid-bg">
              {works.map((work) => (
                <Link key={work.id} href={`/works/${work.id}`} className="group relative block bg-[#0c0d12] border border-white/10 hover:border-lime-green/40 hover:z-20 transition-all p-10 min-h-[400px]">
                   <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-20 transition-opacity">
                      <Hash size={40} />
                   </div>
                   <div className="flex flex-col h-full">
                      <div className="mb-12">
                         <span className="text-[9px] font-mono text-gray-700 block mb-4">LOG_{work.id.toString().padStart(3, '0')}</span>
                         <h3 className="text-2xl md:text-3xl font-display font-black uppercase leading-tight group-hover:text-lime-green transition-colors">{work.title}</h3>
                      </div>
                      <div className="flex-1 text-gray-500 text-xs font-sans leading-relaxed line-clamp-6 opacity-60 group-hover:opacity-100 transition-opacity">
                         <MarkdownRenderer content={work.description} />
                      </div>
                      <div className="mt-12 pt-6 border-t border-white/5 flex items-center justify-between">
                         <span className="text-[8px] font-mono text-gray-700 tracking-[0.2em] uppercase">Status: Valid</span>
                         <div className="flex items-center gap-2 group-hover:gap-4 transition-all text-lime-green">
                            <span className="text-[10px] font-black uppercase tracking-widest">Detail</span>
                            <ChevronRight size={14} />
                         </div>
                      </div>
                   </div>
                </Link>
              ))}
           </div>
        </section>

        {/* 4. Knowledge Graph: Skills */}
        <section className="py-20 border-t border-white/5">
           <div className="flex flex-col md:flex-row items-start justify-between gap-12">
              <div className="max-w-xs">
                 <h2 className="text-3xl font-display font-black mb-6 uppercase">Knowledge Graph</h2>
                 <p className="text-gray-600 text-[11px] font-sans leading-relaxed">これまでの実験で獲得した、主要なコアスキルと使用ツールセットの記録。</p>
              </div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-12">
                 {skills.map((skill) => (
                    <div key={skill.id} className="group">
                       <div className="flex justify-between items-baseline mb-2">
                          <span className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-lime-green transition-colors">{skill.name}</span>
                          <span className="text-[9px] font-mono text-gray-700">{skill.proficiency}%</span>
                       </div>
                       <div className="w-full h-[1px] bg-white/5 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${skill.proficiency}%` }}
                            className="h-full bg-lime-green/50 group-hover:bg-lime-green transition-colors"
                          />
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </section>
      </div>

      {/* Modern Technical Footer */}
      <footer className="border-t border-white/5 bg-[#0c0d12]/50 py-12">
         <div className="max-w-[1440px] mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center text-[9px] font-mono text-gray-700 uppercase tracking-widest">
            <div className="flex items-center gap-8">
               <span>Dice // Laboratory // Archives</span>
               <span className="hidden sm:inline opacity-50">Local_Sector_Osaka</span>
            </div>
            <div className="mt-8 md:mt-0 flex items-center gap-12">
               <a href="/" className="hover:text-lime-green transition-colors">Core_Index</a>
               <a href="/works" className="hover:text-lime-green transition-colors">specimens</a>
               <span className="text-white/20">© 2026</span>
            </div>
         </div>
      </footer>
    </main>
  );
}
