import React from 'react';
import Link from 'next/link';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { Database, Cpu, Globe, ArrowUpRight, ChevronRight, Hash, Layers } from 'lucide-react';

interface Work { id: number; title: string; description: string; image_url: string; github_url: string; }

async function fetchData() {
  const urls = ["http://backend:8080/api/works", "http://127.0.0.1:8080/api/works"];
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) return await res.json();
    } catch (e) {}
  }
  return [];
}

export default async function WorksPage() {
  const works: Work[] = await fetchData();

  return (
    <main className="min-h-screen bg-[#07080a] text-white selection:bg-lime-green selection:text-black relative pt-40 pb-64">
      {/* Background System */}
      <div className="fixed inset-0 tech-grid opacity-[0.15] pointer-events-none" />
      <div className="fixed inset-0 noise-bg opacity-5 pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 relative z-10">
        
        {/* Section Header */}
        <div className="mb-32">
           <div className="flex items-center gap-4 mb-8">
              <Layers size={20} className="text-lime-green" />
              <span className="text-[10px] font-mono tracking-[0.4em] text-lime-green uppercase">Index_Collection</span>
           </div>
           <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter leading-none mb-8">
             WORKS<span className="text-lime-green">.</span>
           </h1>
           <p className="max-w-2xl text-gray-500 text-lg md:text-xl font-light leading-relaxed border-l-2 border-white/5 pl-8 italic">
              日常の製作、実験、そして挑戦の記録。<br />
              一貫性のない好奇心が、ここに収束しています。
           </p>
        </div>

        {/* Refined Grid: High Precision Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 bg-white/5 border border-white/5">
          {works.map((work) => (
            <Link 
              key={work.id} 
              href={`/works/${work.id}`} 
              className="group relative block bg-[#0c0d12] p-10 md:p-12 hover:bg-lime-green/[0.02] transition-all duration-500 overflow-hidden"
            >
               {/* Hover Accent Piece */}
               <div className="absolute top-0 left-0 w-[2px] h-0 bg-lime-green group-hover:h-full transition-all duration-500" />
               
               <div className="flex flex-col h-full relative z-10">
                  <div className="flex justify-between items-start mb-16">
                     <span className="text-[9px] font-mono text-gray-700 tracking-[0.2em] group-hover:text-lime-green/60 transition-colors uppercase">
                        LOG_{work.id.toString().padStart(3, '0')}
                     </span>
                     <Hash size={16} className="text-gray-800 group-hover:text-lime-green/20 transition-colors" />
                  </div>

                  <h2 className="text-3xl font-display font-black tracking-tight uppercase leading-none mb-8 group-hover:text-lime-green transition-colors">
                     {work.title}
                  </h2>

                  <div className="flex-1 opacity-40 group-hover:opacity-100 transition-opacity">
                     <div className="text-sm text-gray-400 font-sans line-clamp-4 leading-relaxed">
                        <MarkdownRenderer content={work.description} />
                      </div>
                  </div>

                  <div className="mt-16 pt-8 border-t border-white/5 flex items-center justify-between">
                     <div className="flex gap-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-lime-green/40 shadow-[0_0_8px_#9CE11466]" />
                        <span className="text-[8px] font-mono text-gray-700 tracking-widest uppercase">Validated</span>
                     </div>
                     <div className="flex items-center gap-2 text-lime-green opacity-0 group-hover:opacity-100 group-hover:gap-4 transition-all">
                        <span className="text-[10px] font-black uppercase tracking-widest">Access</span>
                        <ChevronRight size={14} />
                     </div>
                  </div>
               </div>

               {/* Large Index Number Decorative */}
               <span className="absolute -bottom-12 -right-12 text-[14rem] font-display font-black text-white/[0.01] group-hover:text-white/[0.03] transition-colors pointer-events-none italic select-none">
                  {work.id}
               </span>
            </Link>
          ))}
        </div>

        {/* System Metadata Footer */}
        <div className="mt-32 pt-16 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8">
           <div className="space-y-2">
              <span className="text-[8px] font-mono text-gray-700 uppercase tracking-widest">Core_Node</span>
              <p className="text-[10px] text-white/40">Dice_Laboratory_v4.0</p>
           </div>
           <div className="space-y-2">
              <span className="text-[8px] font-mono text-gray-700 uppercase tracking-widest">Specimens</span>
              <p className="text-[10px] text-white/40">{works.length} Entries Valid</p>
           </div>
           <div className="space-y-2">
              <span className="text-[8px] font-mono text-gray-700 uppercase tracking-widest">Location</span>
              <p className="text-[10px] text-white/40">Osaka_Hub_07</p>
           </div>
           <div className="space-y-2 text-right">
              <span className="text-[8px] font-mono text-gray-700 uppercase tracking-widest">Timestamp</span>
              <p className="text-[10px] text-lime-green/60">2026.Archive.Active</p>
           </div>
        </div>
      </div>
    </main>
  );
}
