"use client";

import React from 'react';
import { Send, Mail, MapPin, MessageSquare, Terminal, Activity, ChevronRight, Hash } from 'lucide-react';

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#07080a] text-white selection:bg-lime-green selection:text-black relative pt-40 pb-64">
      {/* Background System Layers */}
      <div className="fixed inset-0 tech-grid opacity-[0.15] pointer-events-none" />
      <div className="fixed inset-0 noise-bg opacity-5 pointer-events-none mix-blend-soft-light" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(156,225,20,0.05),transparent_60%)]" />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 relative z-10">
        
        {/* Page Header */}
        <div className="mb-24">
           <div className="flex items-center gap-4 mb-8">
              <MessageSquare size={20} className="text-lime-green" />
              <span className="text-[10px] font-mono tracking-[0.4em] text-lime-green uppercase">Communication_Link</span>
           </div>
           <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter leading-none mb-8">
             CONTACT<span className="text-lime-green">.</span>
           </h1>
           <p className="max-w-2xl text-gray-500 text-lg md:text-xl font-light leading-relaxed border-l-2 border-white/5 pl-8 italic">
              アイディアの相談、技術的な対話、またはプロジェクトへの参画。<br />
              新しい繋がりをここから開始します。
           </p>
        </div>

        {/* Contact Module: Social Protocol Pane */}
        <div className="max-w-4xl mx-auto">
           <div className="bg-[#0c0d12] border border-white/10 p-10 md:p-20 rounded-[3rem] relative overflow-hidden text-center group">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] aspect-square bg-[radial-gradient(circle_at_50%_0%,rgba(156,225,20,0.1),transparent_70%)] pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center gap-12">
                 <div className="p-8 rounded-full bg-white/5 border border-white/10 group-hover:border-lime-green group-hover:bg-lime-green/10 transition-all duration-700">
                    <MessageSquare size={48} className="text-gray-500 group-hover:text-lime-green transition-colors" />
                 </div>
                 
                 <div>
                    <h2 className="text-[10px] font-mono text-lime-green mb-6 tracking-[0.5em] uppercase">Communication_Protocol</h2>
                    <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter mb-8 group-hover:scale-105 transition-transform duration-700">
                       X (Twitter) <span className="text-lime-green">DM</span>.
                    </h1>
                    <p className="text-gray-500 text-lg md:text-xl font-light leading-relaxed max-w-xl mx-auto italic">
                       最も迅速な返信が必要な場合は、X (Twitter) のダイレクトメッセージからご連絡ください。<br />
                       アイディアの種から、本格的な開発の相談までお待ちしております。
                    </p>
                 </div>

                 <a 
                   href="https://x.com/dice_2004" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="mt-8 bg-white text-black px-16 py-8 rounded-full font-display font-black text-2xl hover:bg-lime-green transition-all duration-500 flex items-center gap-6 group/btn"
                 >
                    <span>Send Message</span>
                    <Send size={28} className="group-hover/btn:translate-x-2 group-hover/btn:-translate-y-2 transition-transform" />
                 </a>
                 
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 pt-20 border-t border-white/5 w-full">
                    {[
                       { label: "Stability", value: "99.9%" },
                       { label: "Protocol", value: "SOCIAL" },
                       { label: "Encryption", value: "ENABLED" },
                       { label: "Status", value: "ACTIVE" }
                    ].map((item, i) => (
                       <div key={i} className="flex flex-col gap-2">
                          <span className="text-[8px] font-mono text-gray-700 uppercase tracking-widest">{item.label}</span>
                          <span className="text-sm font-mono text-white/40">{item.value}</span>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="absolute bottom-8 right-12 opacity-[0.03] text-[10vw] font-display font-black tracking-tighter pointer-events-none select-none">
                 SOCIAL_LINK
              </div>
           </div>
        </div>

        {/* Similar Metadata Footer Detail */}
        <div className="mt-40 pt-16 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-12 text-[9px] font-mono text-gray-800 tracking-[0.3em] uppercase">
           <div className="flex items-center gap-8 text-gray-700">
              <span>Channel: Encrypted</span>
              <span className="hidden sm:inline">User_ID: Guest_Access</span>
           </div>
           <div className="flex gap-16 text-white/10 italic">
              Link_v4.0.0 // 2026_COLLECTION
           </div>
        </div>
      </div>
    </main>
  );
}
