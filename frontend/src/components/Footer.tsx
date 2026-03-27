import React from 'react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full mt-24 py-8 border-t border-white/10 bg-black/20 backdrop-blur-md text-center text-sm text-gray-500">
      <div className="flex justify-center gap-6 mb-4">
        {/* SNSリンク群 */}
        <a href="https://github.com/dice" target="_blank" rel="noreferrer" className="hover:text-white transition">GitHub</a>
        <a href="https://twitter.com/dice" target="_blank" rel="noreferrer" className="hover:text-white transition">X (Twitter)</a>
        <a href="/admin" className="hover:text-white transition">Admin</a>
      </div>
      <p>© {year} Dice's Portfolio. All rights reserved.</p>
    </footer>
  );
}
