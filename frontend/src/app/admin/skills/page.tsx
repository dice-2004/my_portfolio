"use client";

import React, { useEffect, useState } from "react";

interface Skill { id: number; name: string; category: string; proficiency: number; }
const emptyForm = { name: "", category: "Backend", proficiency: 50 };

export default function AdminSkillsPage() {
  const [token, setToken]       = useState("");
  const [skills, setSkills]     = useState<Skill[]>([]);
  const [form, setForm]         = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [status, setStatus]     = useState("");

  useEffect(() => {
    const t = localStorage.getItem("admin_token") ?? "";
    if (!t) { window.location.href = "/admin"; return; }
    setToken(t);
    fetchSkills();
  }, []);

  const authFetch = (url: string, options: RequestInit = {}) =>
    fetch(url, { ...options, headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("admin_token")}`, ...options.headers } });

  const fetchSkills = async () => {
    const res = await fetch("http://localhost:8080/api/skills");
    if (res.ok) setSkills(await res.json());
  };

  const handleSubmit = async () => {
    const isEditing = editingId !== null;
    const url = isEditing ? `http://localhost:8080/api/admin/skills/${editingId}` : "http://localhost:8080/api/admin/skills";
    const res = await authFetch(url, { method: isEditing ? "PUT" : "POST", body: JSON.stringify(form) });
    if (res.ok) { setStatus(isEditing ? "✅ 更新しました" : "✅ 追加しました"); setForm(emptyForm); setEditingId(null); fetchSkills(); }
    else { setStatus("❌ 保存に失敗しました"); }
    setTimeout(() => setStatus(""), 3000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("削除しますか？")) return;
    const res = await authFetch(`http://localhost:8080/api/admin/skills/${id}`, { method: "DELETE" });
    if (res.ok) { setStatus("🗑️ 削除しました"); fetchSkills(); }
    setTimeout(() => setStatus(""), 3000);
  };

  const categories = ["Backend", "Frontend", "Infrastructure", "Language", "Tool", "Other"];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Skills 管理</h1>
        <a href="/admin/dashboard" className="text-sm text-gray-400 hover:text-white transition">← 戻る</a>
      </div>

      {/* フォーム */}
      <section className="mb-10 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
        <h2 className="text-xl font-bold mb-6">{editingId !== null ? `✏️ 編集中 (ID: ${editingId})` : "➕ 新規スキル追加"}</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input className="col-span-2 bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="スキル名 *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex items-center gap-3">
            <input type="range" min={1} max={100} className="flex-1 accent-purple-500" value={form.proficiency} onChange={(e) => setForm({ ...form, proficiency: Number(e.target.value) })} />
            <span className="text-white font-bold w-10 text-right">{form.proficiency}%</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={handleSubmit} disabled={!form.name} className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 rounded-xl font-bold transition disabled:opacity-40">
            {editingId !== null ? "更新する" : "追加する"}
          </button>
          {editingId !== null && <button onClick={() => { setEditingId(null); setForm(emptyForm); }} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition">キャンセル</button>}
        </div>
        {status && <p className="mt-4 text-center font-bold text-pink-300">{status}</p>}
      </section>

      {/* 一覧 */}
      <div className="space-y-3">
        {skills.map((s) => (
          <div key={s.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
            <div className="flex-1">
              <span className="font-bold text-white">{s.name}</span>
              <span className="ml-3 text-xs bg-purple-600/40 px-2 py-0.5 rounded-full text-purple-200">{s.category}</span>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 bg-white/10 rounded-full h-2 max-w-xs">
                  <div className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full" style={{ width: `${s.proficiency}%` }} />
                </div>
                <span className="text-gray-400 text-xs">{s.proficiency}%</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditingId(s.id); setForm({ name: s.name, category: s.category, proficiency: s.proficiency }); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="px-3 py-1.5 text-sm bg-blue-600/50 hover:bg-blue-600/80 rounded-lg transition font-semibold">編集</button>
              <button onClick={() => handleDelete(s.id)} className="px-3 py-1.5 text-sm bg-red-600/50 hover:bg-red-600/80 rounded-lg transition font-semibold">削除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
