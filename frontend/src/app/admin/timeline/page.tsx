"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface Timeline { id: number; title: string; description: string; event_date: string; category: string; display_order: number; }
const emptyForm = { title: "", description: "", event_date: "2026-01-01", category: "Work", display_order: 1 };

export default function AdminTimelinePage() {
  const [token, setToken]       = useState("");
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [form, setForm]         = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [status, setStatus]     = useState("");

  useEffect(() => {
    const t = localStorage.getItem("admin_token") ?? "";
    if (!t) { window.location.href = "/admin"; return; }
    setToken(t);
    fetchTimelines();
  }, []);

  const authFetch = (url: string, options: RequestInit = {}) =>
    fetch(url, { ...options, headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("admin_token")}` } });

  const fetchTimelines = async () => {
    const res = await fetch("/api/timeline");
    if (res.ok) setTimelines(await res.json());
  };

  const handleSubmit = async () => {
    const isEditing = editingId !== null;
    const url = isEditing ? `/api/admin/timeline/${editingId}` : "/api/admin/timeline";
    const res = await authFetch(url, { method: isEditing ? "PUT" : "POST", body: JSON.stringify(form) });
    if (res.ok) { setStatus(isEditing ? "✅ 更新しました" : "✅ 追加しました"); setForm(emptyForm); setEditingId(null); fetchTimelines(); }
    else { setStatus("❌ 保存に失敗しました"); }
    setTimeout(() => setStatus(""), 3000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("削除しますか？")) return;
    const res = await authFetch(`/api/admin/timeline/${id}`, { method: "DELETE" });
    if (res.ok) { setStatus("🗑️ 削除しました"); fetchTimelines(); }
    setTimeout(() => setStatus(""), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Timeline 管理</h1>
        <a href="/admin/dashboard" className="text-sm text-gray-400 hover:text-white transition">← 戻る</a>
      </div>

      <section className="mb-12 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
        <h2 className="text-xl font-bold mb-4">{editingId !== null ? `✏️ 編集中 (ID: ${editingId})` : "➕ 新規タイムライン追加"}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <input className="col-span-2 bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="タイトル *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input type="date" className="bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
          <input className="bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="カテゴリ (例: Work)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </div>
        
        <div data-color-mode="dark" className="rounded-xl overflow-hidden mb-6">
          <MDEditor value={form.description} onChange={(v) => setForm({ ...form, description: v ?? "" })} height={200} preview="edit" />
        </div>

        <div className="flex gap-4">
          <button onClick={handleSubmit} disabled={!form.title} className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 rounded-xl font-bold transition disabled:opacity-40">
            {editingId !== null ? "更新する" : "追加する"}
          </button>
          {editingId !== null && <button onClick={() => { setEditingId(null); setForm(emptyForm); }} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition">キャンセル</button>}
        </div>
        {status && <p className="mt-4 text-center font-bold text-pink-300">{status}</p>}
      </section>

      <div className="space-y-4">
        {timelines.map((t) => (
          <div key={t.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
            <div>
              <span className="text-gray-400 font-mono text-sm mr-3">{t.event_date}</span>
              <span className="font-bold text-white">{t.title}</span>
              <span className="ml-3 text-xs bg-pink-600/40 px-2 py-0.5 rounded-full text-pink-200">{t.category}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditingId(t.id); setForm({ title: t.title, description: t.description, event_date: t.event_date, category: t.category, display_order: t.display_order }); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="px-3 py-1.5 text-sm bg-blue-600/50 hover:bg-blue-600/80 rounded-lg transition font-semibold">編集</button>
              <button onClick={() => handleDelete(t.id)} className="px-3 py-1.5 text-sm bg-red-600/50 hover:bg-red-600/80 rounded-lg transition font-semibold">削除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
