"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
// Markdownエディタは huge な SSR非対応ライブラリのため、
// Next.js の dynamic import（遅延読込）でクライアント側のみロードする
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

// バックエンドのWork型と対応するTypeScript型定義
interface Work {
  id: number;
  title: string;
  description: string;
  image_url: string;
  github_url: string;
}

// 空の作品フォームの初期値（リセット時にも使う）
const emptyForm = { title: "", description: "", image_url: "", github_url: "" };

export default function AdminWorksPage() {
  const [token, setToken]       = useState("");
  const [works, setWorks]       = useState<Work[]>([]);
  const [form, setForm]         = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [status, setStatus]     = useState("");

  // --- JWTを金庫から取り出す + 作品一覧の初回取得 ---
  useEffect(() => {
    const t = localStorage.getItem("admin_token") ?? "";
    setToken(t);
    if (!t) { window.location.href = "/admin"; return; }
    fetchWorks(t);
  }, []);

  // --- JWT付きの fetch ヘルパー関数 ---
  const authFetch = (url: string, options: RequestInit = {}, t = token) =>
    fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${t}`,
        ...options.headers,
      },
    });

  // --- APIから最新の作品一覧を取得してstateに反映 ---
  const fetchWorks = async (t: string) => {
    const res = await fetch("http://localhost:8080/api/works");
    if (res.ok) setWorks(await res.json());
  };

  // --- フォームの送信（新規作成 or 更新） ---
  const handleSubmit = async () => {
    const isEditing = editingId !== null;
    const url = isEditing
      ? `http://localhost:8080/api/admin/works/${editingId}`
      : "http://localhost:8080/api/admin/works";

    const res = await authFetch(url, {
      method: isEditing ? "PUT" : "POST",  // 更新中はPUT、新規はPOST
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setStatus(isEditing ? "✅ 更新しました" : "✅ 作品を追加しました");
      setForm(emptyForm);     // フォームをリセット
      setEditingId(null);     // 更新モードを解除
      fetchWorks(token);      // 一覧を再取得して画面を更新
    } else {
      setStatus("❌ 保存に失敗しました");
    }
    setTimeout(() => setStatus(""), 3000);
  };

  // --- 「編集」ボタンが押された時の処理 ---
  const handleEdit = (work: Work) => {
    setEditingId(work.id);
    // 既存の作品データをフォームに流し込む
    setForm({
      title: work.title,
      description: work.description,
      image_url: work.image_url ?? "",
      github_url: work.github_url ?? "",
    });
    // 画面の一番上のフォームにスクロールする
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- 「削除」ボタンが押された時の処理 ---
  const handleDelete = async (id: number) => {
    if (!confirm("本当に削除しますか？")) return;
    const res = await authFetch(`http://localhost:8080/api/admin/works/${id}`, { method: "DELETE" });
    if (res.ok) {
      setStatus("🗑️ 削除しました");
      fetchWorks(token);
    }
    setTimeout(() => setStatus(""), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Works 管理
        </h1>
        <a href="/admin/dashboard" className="text-sm text-gray-400 hover:text-white transition">
          ← ダッシュボードへ戻る
        </a>
      </div>

      {/* ===== 作品フォーム（新規 or 編集） ===== */}
      <section className="mb-12 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
        <h2 className="text-xl font-bold mb-6">
          {editingId !== null ? `✏️ 編集中 (ID: ${editingId})` : "➕ 新規作品を追加"}
        </h2>

        <div className="space-y-4">
          <input
            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="タイトル *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="GitHub URL"
            value={form.github_url}
            onChange={(e) => setForm({ ...form, github_url: e.target.value })}
          />
          <input
            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="画像 URL（/no-image.png など）"
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          />

          {/* ===== ここがMarkdownエディタの本体 ===== */}
          {/* data-color-mode="dark" でエディタ全体をダークテーマにする */}
          <div data-color-mode="dark" className="rounded-xl overflow-hidden">
            <MDEditor
              value={form.description}
              onChange={(v) => setForm({ ...form, description: v ?? "" })}
              height={300}
              preview="live"  // 左が入力、右がリアルタイムプレビュー
            />
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={handleSubmit}
            disabled={!form.title || !form.description}
            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 rounded-xl font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {editingId !== null ? "更新する" : "追加する"}
          </button>
          {editingId !== null && (
            <button
              onClick={() => { setEditingId(null); setForm(emptyForm); }}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition"
            >
              キャンセル
            </button>
          )}
        </div>

        {status && <p className="mt-4 text-center font-bold text-pink-300">{status}</p>}
      </section>

      {/* ===== 既存の作品一覧 ===== */}
      <section>
        <h2 className="text-2xl font-bold mb-6 border-b border-white/20 pb-2">
          登録済み作品一覧 ({works.length}件)
        </h2>
        <div className="space-y-4">
          {works.map((work) => (
            <div key={work.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{work.title}</p>
                <p className="text-gray-500 text-xs mt-1 truncate">{work.description.slice(0, 60)}...</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleEdit(work)}
                  className="px-4 py-1.5 text-sm bg-blue-600/50 hover:bg-blue-600/80 rounded-lg transition font-semibold"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(work.id)}
                  className="px-4 py-1.5 text-sm bg-red-600/50 hover:bg-red-600/80 rounded-lg transition font-semibold"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
