"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Terminal, Activity } from 'lucide-react';

export default function Header() {
  const [hovered, setHovered] = React.useState<string | null>(null);

  const navItems = [
    { name: "制作物", path: "/works", ref: "WORKS" },
    { name: "自己紹介", path: "/about", ref: "ABOUT" },
    { name: "コンタクト", path: "/contact", ref: "CONTACT" }
  ];

  return (
    <motion.header 
      initial={{ y: -50, x: "-50%", opacity: 0 }}
      animate={{ y: 0, x: "-50%", opacity: 1 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-auto"
    >
      <div className="relative group">
        <div className="absolute inset-0 bg-lime-green/5 blur-[20px] opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <nav className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/60 backdrop-blur-3xl border border-white/10 shadow-[0_12px_48px_rgba(0,0,0,0.5)]">
          <Link href="/" className="px-5 py-2 group flex items-center gap-4 hover:bg-white/5 rounded-xl transition-all">
             <div className="w-8 h-8 rounded-lg bg-lime-green/10 flex items-center justify-center text-lime-green">
                <Terminal size={16} />
             </div>
             <div className="flex flex-col">
                <span className="text-xs font-black tracking-tighter text-white uppercase leading-none">DICE</span>
                <span className="text-[7px] font-mono text-lime-green opacity-60 uppercase leading-none mt-1">PORTFOLIO</span>
             </div>
          </Link>
          
          <div className="w-px h-6 bg-white/10 mx-2" />

          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.path} 
                onMouseEnter={() => setHovered(item.name)}
                onMouseLeave={() => setHovered(null)}
                className="relative px-5 py-2.5 rounded-xl transition-all group/item"
              >
                {hovered === item.name && (
                   <motion.div 
                     layoutId="nav-bg"
                     className="absolute inset-0 bg-white/5 border border-white/5 rounded-xl z-0"
                     transition={{ duration: 0.2 }}
                   />
                )}
                
                <div className="relative z-10 flex flex-col items-center">
                   <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 group-hover/item:text-white transition-colors">
                     {item.name}
                   </span>
                   <span className="text-[6px] font-mono text-lime-green opacity-0 group-hover/item:opacity-40 transition-opacity mt-1">
                     {item.ref}
                   </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="w-px h-6 bg-white/10 mx-2 hidden sm:block" />

          <div className="px-4 hidden sm:flex items-center gap-2 opacity-30">
             <Activity size={10} className="text-lime-green animate-pulse" />
             <span className="text-[7px] font-mono uppercase tracking-widest">Active</span>
          </div>
        </nav>
      </div>
    </motion.header>
  );
}
