"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import GlassCard from '@/components/GlassCard';
import DiceLogo from '@/components/DiceLogo';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import Typewriter from '@/components/Typewriter';
import { Sparkles, Cpu, ExternalLink, Calendar, Database, Activity, Code2, Layers, ChevronRight, Hash, Terminal, MessageSquare, Send } from 'lucide-react';

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

  // Removed useScroll due to heavy scroll performance on mobile/low-end
  React.useEffect(() => {
    const fetchData = async () => {
      const fetcher = async (path: string) => {
        try {
          // Use the correct portfolio URL if running in production
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://portfolio.dice-ke.tech';
          const res = await fetch(`${baseUrl}/api/${path}`);
          const json = await res.json();
          // Backend might return {error: "..."} on 500
          if (json && !Array.isArray(json) && typeof json === 'object' && 'error' in json) {
            console.error(`API Error on ${path}:`, json.error);
            return path === "about" ? { content: "" } : [];
          }
          return json;
        } catch (e) {
          console.error(`Fetch error on ${path}:`, e);
          return path === "about" ? { content: "" } : [];
        }
      };
      const [works, skills, about, timelines] = await Promise.all([
        fetcher("works"), fetcher("skills"), fetcher("about"), fetcher("timeline")
      ]);
      setData({ 
        works: Array.isArray(works) ? works : [], 
        skills: Array.isArray(skills) ? skills : [], 
        about: about || { content: "" }, 
        timelines: Array.isArray(timelines) ? timelines : [] 
      });

      // Scroll restoration
      setTimeout(() => {
        const lastId = localStorage.getItem('last_work_id');
        if (lastId) {
          const element = document.getElementById(lastId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            localStorage.removeItem('last_work_id');
          }
        }
      }, 500);
    };
    fetchData();
  }, []);

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] overflow-hidden">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-white/5 border-t-cyan-400 rounded-full animate-spin" />
        <span className="text-[10px] font-mono text-white/20 tracking-widest uppercase">Initializing_Link</span>
      </div>
    </div>
  );

  const { works, skills, about, timelines } = data;

  return (
    <main className="min-h-screen font-mono text-white overflow-x-hidden selection:bg-cyan-500 selection:text-black relative">
      {/* Background System Layers with True 3D Simulation */}
      <div className="fixed inset-0 bg-[#020617] z-[-3]" />
      
      <div className="fixed inset-0 pointer-events-none z-[-2] overflow-hidden contain-strict">
         <div className="tech-grid-3d" />
      </div>
      <div className="fixed inset-0 noise-bg opacity-[0.02] pointer-events-none z-[-1]" />

      {/* Deep Dark Glowing Orbs for Glass Dark Simulation */}
      <div 
        className="fixed top-[10%] right-[5%] w-[50vw] h-[50vw] max-w-3xl max-h-3xl bg-blue-600/20 blur-[130px] rounded-full pointer-events-none z-[-1] will-change-transform transform-gpu"
      />
      <div 
        className="fixed bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-4xl max-h-4xl bg-indigo-600/20 blur-[150px] rounded-full pointer-events-none z-[-1] will-change-transform transform-gpu"
      />
      <div 
        className="fixed top-[40%] left-[30%] w-[30vw] h-[30vw] max-w-xl max-h-xl bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none z-[-1] will-change-transform transform-gpu"
      />

      {/* Frame Decorations */}
      <div className="fixed inset-6 border border-white/5 pointer-events-none hidden md:block z-50">
         <div className="absolute top-0 right-0 p-4 flex gap-4">
            <div className="w-1 h-1 bg-cyan-400/80" />
            <div className="w-1 h-1 bg-cyan-400/40" />
         </div>
         <div className="absolute bottom-4 left-4 text-[8px] font-mono text-gray-700 tracking-widest uppercase rotate-90 origin-bottom-left">
            Sector_07 // DAISUKE_ARCHIVE
         </div>
      </div>

      <div className="max-w-[1440px] mx-auto relative z-10 px-6 md:px-12 lg:px-16 pt-32 pb-64">
        
        {/* 1. Technical Hero: Refined Scale */}
        <section className="min-h-[70vh] flex flex-col justify-center relative mb-40">
           <div className="relative z-10 animate-fade-in">
              <div className="flex flex-col gap-2 mb-12 animate-fade-in opacity-0 [animation-delay:200ms] [animation-fill-mode:forwards]">
                 <div className="flex items-center gap-4">
                    <span className="h-[1px] w-12 bg-white/20"></span>
                    <span className="text-[10px] font-mono tracking-[0.4em] text-white/50 uppercase terminal-cursor">System_Initialization // 2026_Core</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-12 items-end relative mt-20">
                 <div className="lg:col-span-12 relative flex flex-col items-start mb-16">
                    <div className="absolute -left-8 md:-left-24 -top-8 md:-top-32 opacity-30 hover:opacity-70 transition-all duration-[1500ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] pointer-events-auto select-none z-0 drop-shadow-[0_0_50px_rgba(34,211,238,0.1)] mix-blend-lighten will-change-transform transform-gpu group/logo">
                       <img 
                          src="/dice.svg" 
                          className="w-[180px] md:w-[500px] h-[180px] md:h-[500px] object-contain -rotate-12 group-hover/logo:rotate-12 transition-transform duration-[2000ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]" 
                          alt="Dice background logo" 
                       />
                    </div>
                    <div className="relative z-10 pointer-events-none">
                       <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black leading-tight tracking-tighter flex flex-col items-start gap-1">
                          <Typewriter text={"DICE\nPORTFOLIO"} className="text-white drop-shadow-lg leading-[1.1]" delay={0.2} speed={0.1} cursor={true} />
                       </h1>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* 2. Structured Content: Information Panes */}
        {/* 2. Structured Content: Information Panes (About) */}
        <section id="about" className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-64 relative z-10 pt-32">
            <div className="col-span-12 mb-8">
               <h3 className="text-[10px] font-mono text-cyan-400 mb-4 tracking-[0.4em] uppercase">[ Operator_Identity ]</h3>
               <h2 className="text-5xl md:text-7xl font-display font-black tracking-tighter uppercase whitespace-nowrap flex items-end">
                  <Typewriter text=">_ABOUT" speed={0.1} delay={0.2} />
               </h2>
            </div>
             <div className="lg:col-span-8 group perspective-[1000px] cursor-default">
                <div className="glass-panel p-10 md:p-14 rounded-none relative overflow-hidden h-full border-white/5">
                   <div className="absolute top-0 right-0 p-8 opacity-[0.01] rotate-12 pointer-events-none mix-blend-screen transition-all duration-1000 group-hover:opacity-[0.03] group-hover:rotate-0">
                      <Cpu size={160} />
                   </div>
                    <div className="prose prose-invert max-w-none prose-p:text-gray-400 prose-p:leading-[1.9] prose-p:font-sans prose-strong:text-white prose-strong:font-bold prose-h2:text-cyan-400 prose-h2:text-[10px] prose-h2:font-mono prose-h2:tracking-[0.4em] prose-h2:uppercase">
                      <div className="inline-block px-2 py-0.5 border border-white/10 text-[8px] text-gray-600 mb-6 tracking-widest uppercase">Mode: Read_Only</div>
                      <MarkdownRenderer content={about.content} />
                    </div>
                </div>
             </div>

            {/* Event Timeline Pane */}
            <div className="lg:col-span-4 flex flex-col gap-6 perspective-[1000px]">
               <div className="glass-panel p-8 rounded-none flex-1 relative overflow-hidden">
                  <div className="absolute top-0 right-3 w-[1px] h-full bg-white/[0.03] pointer-events-none" />
                  <div className="absolute top-0 right-5 w-[1px] h-full bg-white/[0.03] pointer-events-none" />
                  <h3 className="text-[10px] font-mono text-white/40 mb-8 tracking-[0.4em] uppercase border-b border-white/10 pb-4">Chronology_Table</h3>
                  <div className="space-y-6">
                    {timelines.slice(0, 5).map((t) => (
                      <div key={t.id} className="relative pl-6 border-l border-white/5 pb-2">
                        <div className="absolute -left-[1.5px] top-0 w-[4px] h-[1px] bg-white/10" />
                        <div className="text-[9px] font-mono text-gray-600 mb-1">[{t.event_date}]</div>
                        <h4 className="text-sm font-sans tracking-wide text-gray-500">{t.title}</h4>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
        </section>

        {/* 3. Collected Artifacts: Works */}
        <section id="works" className="mb-64 pt-32 border-t border-white/5 relative z-10">
           <div className="flex items-end justify-between mb-20">
              <div>
                 <h3 className="text-[10px] font-mono text-cyan-400 mb-4 tracking-[0.4em] uppercase">[ Collected_Artifacts ]</h3>
                 <h2 className="text-5xl md:text-7xl font-display font-black tracking-tighter uppercase whitespace-nowrap flex items-end">
                    <Typewriter text=">_WORKS" speed={0.1} delay={0.2} />
                 </h2>
              </div>
              <div className="hidden md:block w-96 h-[1px] bg-white/10 mb-5" />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
              {works.map((work, index) => (
                <Link 
                  key={work.id} 
                  id={`work-${work.id}`}
                  href={`/works/${work.id}`} 
                  onClick={() => localStorage.setItem('last_work_id', `work-${work.id}`)}
                  className="group relative block glass-panel-interactive p-10 min-h-[400px] hover:z-20 transition-all duration-500"
                >
                   <div className="absolute top-4 right-4 text-white/10 group-hover:text-cyan-400 transition-colors duration-500 font-mono text-[10px]">
                      [{(index + 1).toString().padStart(2, '0')}]
                   </div>
                   <div className="flex flex-col h-full">
                      <div className="mb-12 border-b border-white/5 pb-6">
                         <span className="text-[9px] font-mono text-gray-500 block mb-4 group-hover:text-cyan-400/50 uppercase">Item_Log_{(index + 1).toString().padStart(3, '0')}</span>
                         <h3 className="text-xl font-bold uppercase leading-tight group-hover:text-cyan-400 transition-colors">{work.title}</h3>
                      </div>
                      <div className="flex-1 text-gray-400 text-xs font-mono leading-relaxed line-clamp-6 opacity-60 group-hover:opacity-100 transition-opacity">
                         <MarkdownRenderer content={work.description} />
                      </div>
                      <div className="mt-12 pt-6 border-t border-white/5 flex items-center justify-between">
                         <span className="text-[8px] font-mono text-gray-600 tracking-[0.2em] uppercase">Status: OK</span>
                         <div className="flex items-center gap-2 group-hover:gap-4 transition-all text-cyan-400 opacity-50 group-hover:opacity-100">
                            <span className="text-[9px] font-mono uppercase tracking-widest">&gt; VIEW_DATA</span>
                            <ChevronRight size={14} />
                         </div>
                      </div>
                   </div>
                </Link>
              ))}
           </div>
        </section>

        {/* 4. Knowledge Graph: Skills */}
        <section id="skills" className="mb-64 border-t border-white/5 pt-32 relative z-10">
           <div className="mb-20">
              <div className="flex items-center gap-4 mb-4">
                 <Activity size={20} className="text-cyan-400" />
                 <span className="text-[10px] font-mono tracking-[0.4em] text-cyan-400 uppercase">[ Capability_Matrix ]</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-display font-black tracking-tighter uppercase whitespace-nowrap flex items-end">
                 <Typewriter text=">_SKILLS" speed={0.1} delay={0.2} />
              </h2>
           </div>
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {skills.map((skill) => (
                 <div key={skill.id} className="glass-panel p-8 border-white/5 cursor-default relative group/skill">
                    <div className="flex justify-between items-baseline mb-6">
                       <span className="text-sm font-mono font-bold uppercase tracking-widest text-gray-700">&gt; {skill.name}</span>
                       <span className="text-[10px] font-mono text-white/10 group-hover/skill:text-white/30 transition-colors">[{skill.proficiency.toString().padStart(3, '0')}]</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 overflow-hidden rounded-none">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.proficiency}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-white/10 relative"
                      >
                         <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/10" />
                      </motion.div>
                   </div>
                </div>
             ))}
           </div>
        </section>

        {/* 5. Contact Module */}
        <section id="contact" className="pt-32 pb-40 border-t border-white/5 relative z-10">
           <div className="mb-16">
              <div className="flex items-center gap-4 mb-4">
                 <MessageSquare size={20} className="text-cyan-400" />
                 <span className="text-[10px] font-mono tracking-[0.4em] text-cyan-400 uppercase">[ Communication_Link ]</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-display font-black tracking-tighter uppercase whitespace-nowrap flex items-end">
                 <Typewriter text=">_CONTACT" speed={0.08} delay={0.2} />
              </h2>
           </div>

           <div className="max-w-2xl mx-auto perspective-[1000px] relative">
              <div className="glass-panel p-8 md:p-12 rounded-sm relative overflow-hidden text-center group">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] aspect-square bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.02),transparent_70%)] pointer-events-none" />
                 
                 <div className="relative z-10 flex flex-col items-center gap-8">
                    <div className="p-6 rounded-none border border-white/10 group-hover:border-cyan-400 group-hover:bg-cyan-400/5 transition-all duration-700 bg-white/[0.02]">
                       <MessageSquare size={32} className="text-gray-500 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    
                    <div>
                       <h3 className="text-[10px] font-mono text-cyan-400 mb-4 tracking-[0.4em] uppercase">&gt; Comm_Protocol</h3>
                       <p className="text-2xl md:text-4xl font-display font-black tracking-tighter mb-4 group-hover:scale-105 transition-transform duration-700 text-white cursor-default">
                          X (Twitter) <span className="text-cyan-400 underline decoration-transparent group-hover:decoration-cyan-400/30">DM</span>.
                       </p>
                    </div>

                    <a 
                      href="https://x.com/_dice_ke" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-4 glass-panel px-12 py-4 border border-white/10 hover:border-cyan-400 hover:bg-white/5 text-white transition-all duration-500 flex items-center gap-4 group/btn shadow-[0_0_20px_rgba(34,211,238,0.05)] hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                    >
                       <span className="font-mono tracking-widest uppercase text-xs">&gt; Send_Message()</span>
                       <Send size={16} className="group-hover/btn:translate-x-2 group-hover/btn:-translate-y-2 group-hover/btn:text-cyan-400 transition-all" />
                    </a>
                 </div>
              </div>
           </div>
        </section>

      </div>
    </main>
  );
}
