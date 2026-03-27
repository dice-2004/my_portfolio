"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DiceLogo() {
  const [isHovered, setIsHovered] = useState(false);
  const [displayText, setdisplayText] = useState("DICE");

  useEffect(() => {
    if (isHovered) {
      const sequence = ["DICE", "DAIS", "DAISU", "DAISUKE"];
      let i = 0;
      const interval = setInterval(() => {
        setdisplayText(sequence[i % sequence.length]);
        i++;
        if (i >= sequence.length) {
          clearInterval(interval);
          setdisplayText("DAISUKE");
        }
      }, 100);
      return () => clearInterval(interval);
    } else {
      setdisplayText("DICE");
    }
  }, [isHovered]);

  return (
    <div 
      className="relative cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-1 font-display font-black tracking-tighter text-4xl">
         <AnimatePresence mode="wait">
            <motion.span
              key={displayText}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className={displayText === "DICE" ? "text-white" : "text-lime-green italic font-bold"}
            >
              {displayText}
            </motion.span>
         </AnimatePresence>
         <span className="text-lime-green">.</span>
      </div>

      <div className="flex gap-2 items-center mt-1 opacity-20">
         <span className="text-[8px] font-mono text-gray-400 tracking-[0.3em] uppercase">DICE // PORTFOLIO</span>
      </div>
    </div>
  );
}
