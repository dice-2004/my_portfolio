"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import Typewriter from '@/components/Typewriter';
import { ChevronLeft, Info, Globe, ShieldCheck, Hash, Calendar, Layers, Terminal, ExternalLink, Code2 } from 'lucide-react';

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

async function fetchWork(id: string) {
  const urls = [
    `http://localhost:8080/api/works/${id}`,
    `http://127.0.0.1:8080/api/works/${id}`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store", next: { revalidate: 0 } });
      if (res.ok) return await res.json();
    } catch (e) {
      // Quietly try next
    }
  }
  return null;
}

export default function WorkDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);
  const [workId, setWorkId] = useState<string>("");

  useEffect(() => {
    // Force instant scroll to top
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    
    const loadWork = async () => {
      const { id } = await paramsPromise;
      setWorkId(id);
      const data = await fetchWork(id);
      setWork(data);
      setLoading(false);
    };
    loadWork();
  }, [paramsPromise]);

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center font-mono">
      <div className="text-[10px] text-cyan-400 animate-pulse tracking-widest uppercase">Initializing_Archive_Link...</div>
    </div>
  );

  if (!work) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white font-mono">
        <div className="text-center p-12 glass-panel rounded-none relative overflow-hidden">
           <h1 className="text-6xl font-display font-black mb-4 tracking-tighter opacity-10">404</h1>
           <p className="text-gray-500 mb-8 font-mono text-[10px] uppercase tracking-widest">&gt; Specimen_Not_Found</p>
           <Link href="/#works" className="text-cyan-400 hover:text-white font-black text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all">
             <ChevronLeft className="w-4 h-4" /> [ Back to Archive ]
           </Link>
        </div>
      </div>
    );
  }

  // Award Logic
  const awardMatch = work.description.match(/🏆 \*\*AWARD:\*\* (.*)/);
  let award = awardMatch ? awardMatch[1] : null;
  const cleanDesc = work.description.replace(/🏆 \*\*AWARD:\*\* (.*)\n\n/, "");

  return (
    <main className="min-h-screen bg-[#020617] text-white selection:bg-cyan-500 selection:text-black relative pt-40 pb-64 font-mono">
      {/* Background System Layers */}
      <div className="fixed inset-0 bg-[#020617] z-[-3]" />
      <div className="fixed inset-0 pointer-events-none z-[-2] overflow-hidden">
         <div className="tech-grid-3d opacity-[0.15]" />
      </div>
      <div className="fixed inset-0 noise-bg opacity-[0.02] pointer-events-none z-[-1]" />
      <div className="fixed top-[20%] right-[10%] w-[35vw] h-[35vw] max-w-xl max-h-xl bg-blue-600/20 blur-[130px] rounded-full pointer-events-none z-[-1]" />
      <div className="fixed bottom-[10%] left-[5%] w-[45vw] h-[45vw] max-w-2xl max-h-2xl bg-cyan-600/20 blur-[150px] rounded-full pointer-events-none z-[-1]" />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 relative z-10">
        
        {/* Detail Header: Specimen Context */}
        <div className="mb-24 flex items-center gap-8 group">
           <Link href="/#works" className="flex items-center gap-4 group/back">
              <div className="w-10 h-10 rounded-none border border-white/5 flex items-center justify-center group-hover/back:border-cyan-400 group-hover/back:bg-cyan-400/5 transition-all">
                 <ChevronLeft className="w-5 h-5 group-hover/back:-translate-x-1 transition-transform text-white group-hover/back:text-cyan-400" />
              </div>
              <span className="text-[10px] font-mono tracking-[0.2em] text-gray-500 group-hover/back:text-white transition-colors uppercase">&gt; Index_Collection</span>
           </Link>
           <div className="h-[1px] flex-1 bg-white/5" />
           <span className="text-[10px] font-mono tracking-[0.4em] text-cyan-400 uppercase">[ LOG_{workId.padStart(3, '0')} ]</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
           
           {/* Left Module: Visual & Meta */}
           <div className="lg:col-span-8 flex flex-col gap-12">
              <div className="glass-panel p-10 md:p-14 rounded-none relative overflow-hidden group">
                  {/* Corner Brackets HUD */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-cyan-400/30" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-cyan-400/30" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-l border-b border-cyan-400/30" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-cyan-400/30" />
                  <div className="absolute top-0 right-1/2 translate-x-1/2 w-20 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
                  
                 <div className="flex flex-col gap-8">
                    <div className="flex items-center gap-4 relative">
                        <Hash size={18} className="text-cyan-400" />
                       <h1 className="text-4xl md:text-7xl font-display font-black tracking-tighter uppercase leading-[0.85] text-white relative">
                          {work.title}
                          <div className="absolute inset-0 pointer-events-none overflow-hidden h-[180%] top-[-40%]">
                             <div className="w-full h-[1px] bg-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.3)] animate-scan-v" />
                          </div>
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
              <div className="glass-panel p-10 rounded-none relative overflow-hidden">
                 <div className="mb-0">
                    <h3 className="text-[10px] font-mono text-cyan-400 mb-10 tracking-[0.4em] uppercase underline decoration-cyan-400/20 underline-offset-8">Spec_Sheet</h3>
                    <div className="space-y-10">
                       <div className="group">
                          <div className="flex items-center gap-3 mb-3 text-gray-700">
                             <Calendar size={14} />
                             <span className="text-[8px] font-mono uppercase tracking-widest">&gt; Timestamp</span>
                          </div>
                          <p className="font-display font-black text-2xl group-hover:text-cyan-400 transition-colors text-white">[{work.period ? work.period : new Date(work.created_at).toLocaleDateString('ja-JP').split('/').join('.')}]</p>
                       </div>

                       <div className="group">
                          <div className="flex items-center gap-3 mb-3 text-gray-700">
                             <Layers size={14} />
                             <span className="text-[8px] font-mono uppercase tracking-widest">&gt; Organization</span>
                          </div>
                          <p className="font-display font-black text-xl text-white">{work.team ? work.team : 'Personal / Undefined'}</p>
                       </div>

                       <div className="group">
                          <div className="flex items-center gap-3 mb-4 text-cyan-400/40">
                             <Terminal size={14} />
                             <span className="text-[8px] font-mono uppercase tracking-widest">&gt; Tech_Stack</span>
                          </div>
                          <ul className="grid grid-cols-1 gap-2">
                            {(work.tech || 'Data missing').split(/[,、] ?/).map((t, i) => (
                              <li key={i} className="flex items-center gap-3 px-3 py-2 bg-white/[0.02] border border-white/5 text-[10px] font-mono text-gray-400 hover:border-cyan-400/30 transition-colors">
                                <Code2 size={10} className="text-cyan-400/50" />
                                {t.trim()}
                              </li>
                            ))}
                          </ul>
                       </div>

                       <div className="group">
                          <div className="flex items-center gap-3 mb-3 text-gray-700">
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
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </main>
  );
}
