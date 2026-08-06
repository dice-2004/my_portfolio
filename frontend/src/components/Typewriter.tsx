"use client";
import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Typewriter コンポーネント
 *
 * パフォーマンス最適化:
 * - useRef + DOM直接更新で React の再レンダリングを回避
 * - CSS animation でカーソル点滅（JS ベースのアニメーション不要）
 * - requestAnimationFrame 不使用（テキスト更新は setTimeout で十分）
 */
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
  const textRef = useRef<HTMLSpanElement>(null);
  const hasStartedRef = useRef(false);
  const cursorRef = useRef<HTMLSpanElement>(null);

  const updateText = useCallback((content: string) => {
    if (textRef.current) {
      textRef.current.textContent = content;
    }
  }, []);

  const setCursorVisible = useCallback((visible: boolean) => {
    if (cursorRef.current) {
      cursorRef.current.style.display = visible ? 'inline-block' : 'none';
    }
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isActive = true;

    // States: 0 = forward, 1 = pause end, 2 = backward, 3 = pause start
    let state = 0; 
    let currentIndex = 0;

    const promptMatch = text.match(/^>_? /) || text.match(/^>_?/);
    const prefix = promptMatch ? promptMatch[0] : "";
    const baseText = text.slice(prefix.length);

    const startTypingLoop = () => {
      hasStartedRef.current = true;
      setCursorVisible(true);
      updateText(prefix);

      const typeChar = () => {
        if (!isActive) return;

        if (state === 0) { // Forward
          currentIndex++;
          updateText(prefix + baseText.slice(0, currentIndex));
          
          if (currentIndex >= baseText.length) {
            state = 1;
            timeoutId = setTimeout(typeChar, 4000);
          } else {
            timeoutId = setTimeout(typeChar, speed * 1000);
          }
        } else if (state === 1) { // Transition to backward
          state = 2;
          typeChar();
        } else if (state === 2) { // Backward (Backspace)
          currentIndex--;
          updateText(prefix + baseText.slice(0, currentIndex));
          
          if (currentIndex <= 0) {
            state = 3;
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
  }, [text, delay, speed, updateText, setCursorVisible]);

  return (
    <span className={`${className} whitespace-pre-wrap`}>
      <span ref={textRef} />
      {cursor && (
        <span 
          ref={cursorRef}
          className="inline-block font-normal text-cyan-400 font-mono ml-[2px] animate-cursor-blink"
          style={{ display: 'none' }}
        >
          _
        </span>
      )}
    </span>
  );
}
