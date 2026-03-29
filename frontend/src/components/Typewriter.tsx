"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Typewriter({ 
  text, 
  delay = 0, 
  className = "",
  speed = 0.05,
  cursor = true,
}: { 
  text: string, 
  delay?: number, 
  className?: string,
  speed?: number,
  cursor?: boolean,
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isActive = true; // Use this to prevent state updates if unmounted
    
    // States: 0 = forward, 1 = pause end, 2 = backward, 3 = pause start
    let state = 0; 
    let currentIndex = 0;

    const startTypingLoop = () => {
      setHasStarted(true);
      
      const promptMatch = text.match(/^>_? /) || text.match(/^>_?/);
      const prefix = promptMatch ? promptMatch[0] : "";
      const baseText = text.slice(prefix.length);
      
      setDisplayedText(prefix);

      const typeChar = () => {
        if (!isActive) return;

        if (state === 0) { // Forward
          setIsTyping(true);
          currentIndex++;
          setDisplayedText(prefix + baseText.slice(0, currentIndex));
          
          if (currentIndex >= baseText.length) {
            state = 1;
            setIsTyping(false);
            timeoutId = setTimeout(typeChar, 4000); // Wait longer at end
          } else {
            timeoutId = setTimeout(typeChar, speed * 1000);
          }
        } else if (state === 1) { // Transition to backward
          state = 2;
          typeChar();
        } else if (state === 2) { // Backward (Backspace)
          setIsTyping(true);
          currentIndex--;
          setDisplayedText(prefix + baseText.slice(0, currentIndex));
          
          if (currentIndex <= 0) {
            state = 3;
            setIsTyping(false);
            timeoutId = setTimeout(typeChar, 1000); 
          } else {
            timeoutId = setTimeout(typeChar, (speed * 1000) / 2);
          }
        } else if (state === 3) {
          state = 0;
          typeChar();
        }
      };

      typeChar();
    };

    timeoutId = setTimeout(startTypingLoop, delay * 1000);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [text, delay, speed]);

  return (
    <span className={`${className} whitespace-pre-wrap`}>
      {displayedText}
      {hasStarted && cursor && (
        <motion.span 
          animate={isTyping ? { opacity: 1 } : { opacity: [1, 0, 1] }} 
          transition={isTyping ? {} : { repeat: Infinity, duration: 0.8, ease: "linear" }}
          className="inline-block font-normal text-cyan-400 font-mono ml-[2px]"
        >
          _
        </motion.span>
      )}
    </span>
  );
}
