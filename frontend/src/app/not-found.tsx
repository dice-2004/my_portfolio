import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4 opacity-80">
        404
      </h1>
      <h2 className="text-2xl font-bold text-white mb-6">Page Not Found</h2>
      <p className="text-gray-400 max-w-md mx-auto mb-10">
        お探しのページは存在しないか、移動した可能性があります。URLが正しいかご確認ください。
      </p>
      
      {/* 光るボタンの演出 */}
      <Link href="/" className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white font-bold transition-all backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]">
        トップページに戻る
      </Link>
    </div>
  );
}
