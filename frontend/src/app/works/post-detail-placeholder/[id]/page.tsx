import React from 'react';
import Link from 'next/link';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import Typewriter from '@/components/Typewriter';
import { ChevronLeft, Info, Globe, ShieldCheck, Hash, Calendar, Layers, Terminal, ExternalLink } from 'lucide-react';

interface Work {
  id: number;
  title: string;
  description: string;
  image_url: string;
  github_url: string;
  created_at: string;
}

async function fetchWork(id: string) {
  const urls = [
    `http://backend:8080/api/works/${id}`,
    `http://127.0.0.1:8080/api/works/${id}`,
    `http://localhost:8080/api/works/${id}`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store", next: { revalidate: 0 } });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error(`Error fetching from ${url}:`, e);
    }
  }
  return null;
}

export default async function WorkDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const work: Work | null = await fetchWork(id);

  if (!work) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white font-mono">
        <div className="text-center p-12 glass-panel rounded-3xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-[0.02] scale-150 rotate-12 pointer-events-none">
              <Hash size={160} />
           </div>
           <h1 className="text-6xl font-display font-black mb-4 tracking-tighter opacity-10">404</h1>
           <p className="text-gray-500 mb-8 font-mono text-[10px] uppercase tracking-widest">&gt; Specimen_Not_Found</p>
           <Link href="/works" className="text-cyan-400 hover:text-white font-black text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all">
             <ChevronLeft className="w-4 h-4" /> [ Back to Archive ]
           </Link>
        </div>
      </div>
    );
  }

  // Award Logic
  const awardKeywords = [
    { key: "サイバーエージェント賞", label: "Award: CA" },
    { key: "学内1位", label: "Award: Campus" },
    { key: "1位を受賞", label: "Award: Gold" },
    { key: "優勝", label: "Award: First Place" }
  ];
  let award = null;
  for (const item of awardKeywords) {
    if (work.description.includes(item.key)) { award = item.label; break; }
  }
  const awardMatch = work.description.match(/🏆 \*\*AWARD:\*\* (.*)/);
  if (awardMatch) award = awardMatch[1];
  const cleanDesc = work.description.replace(/🏆 \*\*AWARD:\*\* (.*)\n\n/, "");

  return (
    <main className="min-h-screen bg-[#020617] text-white selection:bg-cyan-500 selection:text-black relative pt-40 pb-64 font-mono">
      {/* Background System Layers */}
      <div className="fixed inset-0 tech-grid-3d opacity-[0.15] pointer-events-none" />
      <div className="fixed inset-0 noise-bg opacity-[0.02] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.03),transparent_60%)]" />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 relative z-10">
        
        {/* Detail Header: Specimen Context */}
        <div className="mb-24 flex items-center gap-8 group">
           <Link href="/works" className="flex items-center gap-4 group/back">
              <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center group-hover/back:border-cyan-400 group-hover/back:bg-cyan-400/5 transition-all">
                 <ChevronLeft className="w-5 h-5 group-hover/back:-translate-x-1 transition-transform text-white group-hover/back:text-cyan-400" />
              </div>
              <span className="text-[10px] font-mono tracking-[0.2em] text-gray-500 group-hover/back:text-white transition-colors uppercase">&gt; Index_Collection</span>
           </Link>
           <div className="h-[1px] flex-1 bg-white/5" />
           <span className="text-[10px] font-mono tracking-[0.4em] text-cyan-400 uppercase">[ LOG_{id.padStart(3, '0')} ]</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
           
           {/* Left Module: Visual & Meta */}
           <div className="lg:col-span-8 flex flex-col gap-12">
              <div className="glass-panel p-10 md:p-14 rounded-3xl relative overflow-hidden">
                 <div className="flex flex-col gap-8">
                    <div className="flex items-center gap-4">
                       <Hash size={18} className="text-cyan-400" />
                       <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight uppercase leading-none text-white">
                          {work.title}
                       </h1>
                    </div>
                    {award && (
                       <div className="px-5 py-2 w-fit bg-cyan-400/10 border border-cyan-400/40 text-cyan-400 text-[10px] font-black tracking-widest uppercase rounded-full flex items-center gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          {award}
                       </div>
                    )}
                    <div className="prose prose-invert prose-lg max-w-none 
                       prose-h2:text-3xl prose-h2:font-display prose-h2:font-black prose-h2:tracking-tight prose-h2:mb-8 prose-h2:mt-16 first:prose-h2:mt-0 prose-h2:text-white
                       prose-h3:text-cyan-400 prose-h3:text-[10px] prose-h3:uppercase prose-h3:tracking-[0.3em] prose-h3:font-black prose-h3:mb-6 prose-h3:border-l-2 prose-h3:border-cyan-400 prose-h3:pl-4
                       prose-p:text-gray-400 prose-p:leading-[1.8] prose-p:text-sm
                       prose-li:text-gray-500 prose-li:text-xs">
                       <MarkdownRenderer content={cleanDesc} />
                    </div>
                 </div>
              </div>
           </div>

           {/* Right Module: Technical Specs Pane */}
           <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-32">
              <div className="glass-panel p-10 rounded-3xl relative overflow-hidden">
                 <div className="mb-12">
                    <h3 className="text-[10px] font-mono text-cyan-400 mb-10 tracking-[0.4em] uppercase underline decoration-cyan-400/20 underline-offset-8">Spec_Sheet</h3>
                    <div className="space-y-10">
                       <div className="group">
                          <div className="flex items-center gap-3 mb-3 text-gray-500">
                             <Calendar size={14} />
                             <span className="text-[8px] font-mono uppercase tracking-widest">&gt; Timestamp</span>
                          </div>
                          <p className="font-display font-black text-2xl group-hover:text-cyan-400 transition-colors text-white">[{new Date(work.created_at).toLocaleDateString('ja-JP').split('/').join('.')}]</p>
                       </div>

                       <div className="group">
                          <div className="flex items-center gap-3 mb-3 text-gray-500">
                             <Globe size={14} />
                             <span className="text-[8px] font-mono uppercase tracking-widest">&gt; Source_Code</span>
                          </div>
                          {work.github_url ? (
                             <a href={work.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group/link">
                                <span className="font-display font-black text-2xl text-cyan-400 group-hover/link:underline underline-offset-8 decoration-white">PUBLIC_REPO</span>
                                <ExternalLink size={16} className="text-white/20 group-hover/link:text-white transition-colors" />
                             </a>
                          ) : (
                             <p className="font-display font-black text-2xl text-gray-800 italic select-none tracking-tighter">RESTRICTED_ACCESS</p>
                          )}
                       </div>

                       <div className="group">
                          <div className="flex items-center gap-3 mb-3 text-gray-500">
                             <ShieldCheck size={14} />
                             <span className="text-[8px] font-mono uppercase tracking-widest">&gt; Protocol</span>
                          </div>
                          <p className="text-[10px] text-gray-500 leading-relaxed italic">
                             Verified Archives
                          </p>
                       </div>
                    </div>
                 </div>
                 
                 <div className="pt-8 border-t border-white/5 flex items-center justify-between text-[8px] font-mono text-gray-700 tracking-widest uppercase">
                    <span>Archive_Stability: 100%</span>
                    <span>Link: Verified</span>
                 </div>
              </div>

              {/* Bottom CTA to Contact or Home */}
              <Link href="/contact" className="bg-white/5 border border-white/10 hover:border-cyan-400 text-white p-10 rounded-3xl flex items-center justify-between group hover:bg-cyan-400/5 transition-all duration-500">
                 <div>
                    <h3 className="text-xl font-display font-black uppercase leading-none group-hover:text-cyan-400">&gt; Inquiry</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-60">sys_req: protocol</p>
                 </div>
                 <Terminal size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-cyan-400 transition-all" />
              </Link>
           </div>
        </div>

        {/* Similar Metadata Footer Detail */}
        <div className="mt-40 pt-16 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-12 text-[9px] font-mono text-gray-800 tracking-[0.3em] uppercase">
           <div className="flex items-center gap-8">
              <span>Specimen: {work.title}</span>
              <span className="hidden sm:inline">User_Auth: Admin_Daisuke</span>
           </div>
           <div className="flex gap-16 text-white/10 italic">
              Established_Link_v4.0.0
           </div>
        </div>
      </div>
    </main>
  );
}
