"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [pingResult, setPingResult] = useState("");

  // --- ページ読み込み時の処理 ---
  // ブラウザの localStorage（金庫）から身分証(JWT)を取り出す
  useEffect(() => {
    const saved = localStorage.getItem("admin_token");
    // 身分証が金庫になければ、ログインページへ強制送還する
    if (!saved) {
      router.push("/admin");
      return;
    }
    setToken(saved);
  }, [router]);

  // --- JWT（身分証）を付けてAPIを叩く関数 ---
  // これがいわゆる「認証付きリクエスト」の基本パターンです
  const authFetch = (url: string, options: RequestInit = {}) =>
    fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        // ★ここがポイント: "Authorization: Bearer <JWTの文字列>" を毎回付ける
        "Authorization": `Bearer ${token}`,
        ...options.headers,
      },
    });


  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin");
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Admin Dashboard
        </h1>
        <button
          onClick={handleLogout}
          className="px-5 py-2 bg-red-600/50 hover:bg-red-600/80 rounded-full text-sm font-bold transition"
        >
          ログアウト
        </button>
      </div>

      <p className="text-gray-400 mb-10">
        ✅ JWT認証通過済み。このページはあなただけが見ることができます。
      </p>


      {/* --- 今後の管理機能（Phase 4）のためのプレースホルダー --- */}
      <section>
        <h2 className="text-2xl font-bold mb-6 border-b border-white/20 pb-2">コンテンツ管理</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href="/admin/works"
            className="p-6 rounded-2xl bg-white/10 border border-white/20 shadow-xl hover:bg-white/20 transition-all duration-300"
          >
            <h3 className="text-lg font-bold">Works（作品）</h3>
            <p className="text-gray-400 text-sm mt-2">作品の追加・編集・削除はこちらから →</p>
          </a>
          <a href="/admin/timeline" className="p-6 rounded-2xl bg-white/10 border border-white/20 shadow-xl hover:bg-white/20 transition-all duration-300">
            <h3 className="text-lg font-bold">タイムライン（Timeline）</h3>
            <p className="text-gray-400 text-sm mt-2">経歴やイベントの追加・削除はこちらから →</p>
          </a>
          <a href="/admin/skills" className="p-6 rounded-2xl bg-white/10 border border-white/20 shadow-xl hover:bg-white/20 transition-all duration-300">
            <h3 className="text-lg font-bold">スキル（Skills）</h3>
            <p className="text-gray-400 text-sm mt-2">スキルの追加・編集・削除はこちらから →</p>
          </a>
          <a href="/admin/about" className="p-6 rounded-2xl bg-white/10 border border-white/20 shadow-xl hover:bg-white/20 transition-all duration-300">
            <h3 className="text-lg font-bold">About（自己紹介）</h3>
            <p className="text-gray-400 text-sm mt-2">自己紹介文のMarkdown編集はこちらから →</p>
          </a>
        </div>
      </section>
    </div>
  );
}
