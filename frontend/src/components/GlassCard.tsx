"use client";

import React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface GlassCardProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function GlassCard({ title, description, children, className = "" }: GlassCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);

    // Update glow position and opacity
    const glow : any = document.getElementById(`glow-${title?.replace(/\s+/g, '-').toLowerCase()}`);
    if (glow) {
      glow.style.setProperty('--mouse-x', `${(mouseX / width) * 100}%`);
      glow.style.setProperty('--mouse-y', `${(mouseY / height) * 100}%`);
      glow.style.opacity = '1';
    }
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        handleMouseLeave();
        // Reset glow
        const glow : any = document.getElementById(`glow-${title?.replace(/\s+/g, '-').toLowerCase()}`);
        if (glow) glow.style.opacity = '0';
      }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative p-8 rounded-[2rem] glass glass-hover transition-all duration-300 group overflow-hidden corner-ornament glass-card-hover ${className}`}
    >
      {/* Mouse Follow Glow */}
      <div 
        id={`glow-${title?.replace(/\s+/g, '-').toLowerCase()}`}
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: "radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(6, 182, 212, 0.15) 0%, transparent 60%)",
        }}
      />
      
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none bg-scanline opacity-[0.03] translate-y-[-100%] animate-scanline" />

      <div className="relative z-10" style={{ transform: "translateZ(60px)" }}>
        {title && (
          <div className="flex flex-col mb-4">
             <span className="data-label mb-1">SPECIMEN_{title.toUpperCase().slice(0, 4)}</span>
             <h2 className="text-3xl font-display font-black tracking-tighter text-white leading-none group-hover:text-neon-cyan transition-colors">{title}</h2>
          </div>
        )}
        {description && (
          <p className="text-gray-400 text-sm leading-relaxed font-sans mt-2">{description}</p>
        )}
        <div className={title || description ? "mt-6" : ""}>
          {children}
        </div>
      </div>

      {/* Experimental Decoration */}
      <div className="absolute top-4 left-4 h-8 w-[1px] bg-white/20" />
      <div className="absolute top-4 left-4 w-8 h-[1px] bg-white/20" />
      <div className="absolute bottom-4 right-4 h-8 w-[1px] bg-white/20" />
      <div className="absolute bottom-4 right-4 w-8 h-[1px] bg-white/20" />
    </motion.div>
  );
}
