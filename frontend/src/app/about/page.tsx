import React from 'react';
import Link from 'next/link';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { Cpu, Terminal, Compass, Archive, Hash, Activity, ChevronRight } from 'lucide-react';

interface About { id: number; content: string; }
interface Timeline { id: number; title: string; description: string; event_date: string; category: string; display_order: number; }

async function fetchData() {
  const fetcher = (path: string) => fetch(`http://backend:8080/api/${path}`, { cache: "no-store" }).then(res => res.json());
  const [about, timelines] = await Promise.all([ fetcher("about"), fetcher("timeline") ]);
  return { about: about as About, timelines: timelines as Timeline[] };
}

export default async function AboutPage() {
  const { about, timelines } = await fetchData();

  return (
    <div className="relative min-h-screen pt-40 pb-64 overflow-x-hidden bg-[#07080a] selection:bg-lime-green selection:text-black">
      {/* Background Decor */}
      <div className="fixed inset-0 tech-grid opacity-[0.15] pointer-events-none" />
      <div className="noise-bg fixed inset-0 opacity-5 pointer-events-none mix-blend-soft-light" />
      
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 relative z-10">
        
        {/* Page Hero: Refined Identification Header */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-12 mb-32">
           <div className="flex flex-col items-start gap-8">
              <div className="flex items-center gap-4">
                 <Cpu size={20} className="text-lime-green" />
                 <span className="text-[10px] font-mono tracking-[0.4em] text-lime-green uppercase">Identification_Module</span>
              </div>
              <h1 className="text-6xl md:text-[8rem] font-display font-black tracking-tighter leading-[0.85] uppercase">
                 Daisuke<span className="text-lime-green">.</span>
              </h1>
           </div>
           <div className="border-l-2 border-white/5 pl-8 italic mb-4">
              <p className="max-w-md text-gray-500 text-lg font-light leading-relaxed">
                好奇心を燃料に、技術を実験し、<br />
                形にするプロセスの記録。
              </p>
           </div>
        </div>

        {/* Story Section: Workspace Panes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-40">
           {/* Detailed Profile Pane */}
           <div className="lg:col-span-8 group relative">
              <div className="absolute -top-4 left-10 px-4 py-1 bg-lime-green text-black text-[8px] font-mono font-black uppercase tracking-widest z-20">
                 Record_01 // Narrative
              </div>
              <div className="bg-[#0c0d12] border border-white/10 p-10 md:p-20 rounded-[2.5rem] relative overflow-hidden transition-all duration-700 hover:border-lime-green/30">
                 <div className="absolute top-0 right-0 p-12 opacity-[0.02] scale-150 rotate-12 pointer-events-none group-hover:opacity-[0.05] group-hover:rotate-0 transition-all duration-1000">
                    <Terminal size={200} />
                 </div>
                 <div className="flex items-center gap-6 mb-16">
                    <span className="text-[9px] font-mono text-lime-green tracking-[0.4em] uppercase">User_Log // Content</span>
                    <div className="h-[1px] flex-1 bg-white/5" />
                 </div>
                 <div className="prose prose-invert prose-xl max-w-none prose-p:text-gray-400 prose-p:leading-[1.9] prose-strong:text-white prose-strong:font-black prose-h2:text-white prose-h2:font-display prose-h2:font-black prose-h2:tracking-tighter prose-h2:text-4xl">
                    <MarkdownRenderer content={about.content} />
                 </div>
              </div>
           </div>

           {/* Core Philosophy Pane */}
           <div className="lg:col-span-4 flex flex-col gap-8">
              <div className="bg-[#0c0d12] border border-white/10 p-12 rounded-[2.5rem] relative overflow-hidden group hover:border-white/20 transition-colors">
                 <div className="mb-12">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:bg-lime-green/10 group-hover:border-lime-green/20 transition-all">
                       <Compass size={24} className="text-lime-green" />
                    </div>
                    <h3 className="text-[10px] font-mono text-gray-700 tracking-[0.5em] uppercase mb-4">Philosophy_Lab</h3>
                    <p className="text-gray-400 font-sans leading-relaxed italic text-lg">
                       「好奇心のままに。技術を実験し、形にする。」<br />
                       一貫性よりも、その瞬間の熱量を大切にしています。
                    </p>
                 </div>
                 <div className="pt-10 border-t border-white/5">
                    <div className="flex flex-col gap-4 text-[9px] font-mono text-gray-800 uppercase tracking-widest">
                       <div className="flex justify-between items-center">
                          <span>Status</span>
                          <span className="text-lime-green animate-pulse">● Active</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span>Sector</span>
                          <span className="text-white/40">Osaka / 07</span>
                       </div>
                    </div>
                 </div>
              </div>
              
              <Link href="/contact" className="bg-white p-12 rounded-[2.5rem] flex items-center justify-between group hover:bg-lime-green transition-all duration-500">
                 <div className="text-black">
                    <h3 className="text-2xl font-display font-black uppercase leading-none">Transmission</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-50">Signal_Start</p>
                 </div>
                 <ChevronRight size={36} className="text-black group-hover:translate-x-2 transition-transform duration-500" />
              </Link>
           </div>
        </div>

        {/* Timeline Table: High Precision Archive */}
        <section className="bg-[#0c0d12]/50 border-y border-white/5 py-24">
           <div className="mb-20 flex flex-col md:flex-row items-baseline justify-between gap-8">
              <div className="flex items-center gap-6">
                 <Archive size={24} className="text-lime-green" />
                 <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter uppercase whitespace-nowrap">TIMELINE<span className="text-lime-green">.</span></h2>
              </div>
              <div className="h-[1px] flex-1 bg-white/5" />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 bg-white/5 border border-white/5">
              {timelines.map((t, i) => (
                 <div key={t.id} className="bg-[#0c0d12] p-10 hover:bg-lime-green/[0.02] transition-colors group">
                    <div className="flex justify-between items-start mb-12">
                       <span className="text-2xl font-display font-black text-gray-800 tabular-nums group-hover:text-lime-green transition-all">{t.event_date.split('-')[0]}</span>
                       <Hash size={12} className="text-gray-900 group-hover:text-lime-green/20" />
                    </div>
                    <div className="space-y-4">
                       <span className="text-[8px] font-mono text-gray-700 tracking-widest uppercase block mb-2">{t.category}</span>
                       <h3 className="text-lg font-display font-black text-white group-hover:text-lime-green transition-colors leading-tight">{t.title}</h3>
                    </div>
                 </div>
              ))}
           </div>
        </section>

        {/* Performance / Status Overlay Footer */}
        <div className="mt-32 pt-16 flex flex-col md:flex-row items-center justify-between gap-12 border-t border-white/5">
           <div className="flex items-center gap-8 text-[9px] font-mono text-gray-700 tracking-widest">
              <div className="flex items-center gap-2">
                 <Activity size={10} className="text-lime-green" />
                 <span>Link_Stability: 99%</span>
              </div>
              <span className="hidden sm:inline">User: Daisuke_Admin</span>
           </div>
           <div className="flex gap-16 text-[9px] font-mono text-gray-700 tracking-widest uppercase">
              <span className="text-white/20">Archival_Link_Established // 大阪市</span>
           </div>
        </div>
      </div>
    </div>
  );
}
