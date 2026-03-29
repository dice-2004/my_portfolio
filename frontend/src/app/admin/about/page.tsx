"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export default function AdminAboutPage() {
  const [content, setContent] = useState("");
  const [status, setStatus]   = useState("");

  useEffect(() => {
    if (!localStorage.getItem("admin_token")) { window.location.href = "/admin"; return; }
    // 現在の自己紹介文を取得してエディタに流し込む
    fetch("/api/about")
      .then(r => r.json())
      .then(d => setContent(d.content ?? ""));
  }, []);

  const handleSave = async () => {
    const res = await fetch("/api/admin/about", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("admin_token")}` },
      body: JSON.stringify({ content }),
    });
    setStatus(res.ok ? "✅ 保存しました！" : "❌ 保存に失敗しました");
    setTimeout(() => setStatus(""), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">About 編集</h1>
        <a href="/admin/dashboard" className="text-sm text-gray-400 hover:text-white transition">← 戻る</a>
      </div>

      <div data-color-mode="dark" className="rounded-2xl overflow-hidden mb-6 border border-white/20">
        <MDEditor value={content} onChange={(v) => setContent(v ?? "")} height={450} preview="live" />
      </div>

      <div className="flex items-center gap-4">
        <button onClick={handleSave} className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 rounded-xl font-bold transition shadow-lg">
          保存する
        </button>
        {status && <p className="font-bold text-pink-300">{status}</p>}
      </div>
    </div>
  );
}
