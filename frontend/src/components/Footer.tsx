import React from 'react';
import { Terminal } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full py-12 border-t border-white/5 bg-[#020617] backdrop-blur-md text-center text-xs text-gray-500 font-mono relative z-10 selection:bg-cyan-500 selection:text-black mt-auto">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <a href="https://github.com/dice" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors uppercase tracking-widest text-[10px]">&gt;_GitHub</a>
          <a href="https://twitter.com/dice" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors uppercase tracking-widest text-[10px]">&gt;_X</a>
          <a href="/admin" className="hover:text-cyan-400 transition-colors uppercase tracking-widest text-[10px]">&gt;_Admin</a>
        </div>
        
        <div className="flex flex-col items-center md:items-end gap-3">
           <div className="flex items-center gap-2 text-cyan-400/60 bg-cyan-400/5 px-3 py-1 border border-cyan-400/10">
              <Terminal size={12} className="animate-pulse" />
              <span className="text-[9px] uppercase tracking-[0.3em]">Co-created with AI Assistant</span>
           </div>
           <p className="text-[10px] tracking-widest opacity-40 uppercase">© {year} DICE_ARCHIVE. All rights secured.</p>
        </div>
      </div>
    </footer>
  );
}
