"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

/**
 * Header コンポーネント
 *
 * パフォーマンス最適化:
 * - 入場アニメーションを CSS @keyframes に置換（framer-motion の JS 初期化不要）
 * - ナビのホバー背景のみ framer-motion layoutId を使用（CSS では困難な shared layout animation）
 */
export default function Header() {
  const [hovered, setHovered] = React.useState<string | null>(null);

  const navItems = [
    { name: "自己紹介", path: "/#about", ref: "ABOUT" },
    { name: "制作物", path: "/#works", ref: "WORKS" },
    { name: "スキル", path: "/#skills", ref: "SKILLS" },
    { name: "コンタクト", path: "/#contact", ref: "CONTACT" }
  ];

  return (
    <header 
      className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-auto animate-header-enter"
    >
      <div className="relative group">
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: '0 0 20px rgba(6, 182, 212, 0.05)' }} />
        
        <nav className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#020617]/95 border border-white/10 shadow-[0_12px_48px_rgba(0,0,0,0.5)]">
          <Link href="/" className="px-5 py-2 group flex items-center gap-4 hover:bg-white/5 rounded-xl transition-colors">
             <div className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400 overflow-hidden">
                <img src="/dice.svg" width={20} height={20} alt="Dice Logo" className="object-contain" />
             </div>
             <div className="flex flex-col">
                <span className="text-xs font-black tracking-tighter text-white uppercase leading-none">&gt;_DICE</span>
                <span className="text-[7px] font-mono text-cyan-400 opacity-60 uppercase leading-none mt-1">PORTFOLIO</span>
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
                className="relative px-3 sm:px-5 py-2.5 rounded-xl transition-colors group/item"
              >
                {hovered === item.name && (
                   <motion.div 
                     layoutId="nav-bg"
                     className="absolute inset-0 bg-white/5 border border-white/5 rounded-xl z-0"
                     transition={{ duration: 0.2 }}
                   />
                )}
                
                <div className="relative z-10 flex flex-col items-center">
                   <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 group-hover/item:text-cyan-400 transition-colors">
                     {item.name}
                   </span>
                   <span className="text-[6px] font-mono text-cyan-400 opacity-0 group-hover/item:opacity-40 transition-opacity mt-1">
                     {item.ref}
                   </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="w-px h-6 bg-white/10 mx-2 hidden sm:block" />

          <div className="px-4 hidden sm:flex items-center gap-2 opacity-30">
             <Activity size={10} className="text-cyan-400 animate-pulse" />
             <span className="text-[7px] font-mono uppercase tracking-widest text-cyan-400">Terminal_Active</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
