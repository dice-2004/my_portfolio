"use client";

import React, { useEffect, useState } from "react";
import { Move, Save, Edit, Trash2, ArrowLeft, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Reorder } from "framer-motion";

interface Skill { id: number; name: string; category: string; proficiency: number; display_order: number; }
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
    fetch(url, { 
      ...options, 
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${localStorage.getItem("admin_token")}`, 
        ...options.headers 
      } 
    });

  const fetchSkills = async () => {
    const res = await fetch("http://localhost:8080/api/skills");
    if (res.ok) {
       const data = await res.json();
       setSkills(data.sort((a: any, b: any) => a.display_order - b.display_order));
    }
  };

  const saveOrder = async () => {
    const orderData = skills.map((s, i) => ({ id: s.id, order: i }));
    const res = await authFetch("http://localhost:8080/api/admin/skills/order", {
       method: "PUT",
       body: JSON.stringify(orderData)
    });
    if (res.ok) {
       setStatus("✅ Order updated.");
       fetchSkills();
    } else {
       setStatus("❌ Update failed.");
    }
    setTimeout(() => setStatus(""), 3000);
  };

  const handleSubmit = async () => {
    const isEditing = editingId !== null;
    const url = isEditing ? `http://localhost:8080/api/admin/skills/${editingId}` : "http://localhost:8080/api/admin/skills";
    const res = await authFetch(url, { method: isEditing ? "PUT" : "POST", body: JSON.stringify(form) });
    if (res.ok) { 
       setStatus(isEditing ? "✅ Updated" : "✅ Added"); 
       setForm(emptyForm); 
       setEditingId(null); 
       fetchSkills(); 
    } else { 
       setStatus("❌ Error saving"); 
    }
    setTimeout(() => setStatus(""), 3000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this entry?")) return;
    const res = await authFetch(`http://localhost:8080/api/admin/skills/${id}`, { method: "DELETE" });
    if (res.ok) { setStatus("🗑️ Deleted"); fetchSkills(); }
    setTimeout(() => setStatus(""), 3000);
  };

  const categories = ["Backend", "Frontend", "Infrastructure", "Language", "Tool", "Other"];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 font-mono text-white">
      <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-6">
        <div>
           <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Skill_Registry_Control</h1>
           <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest">Awaiting command input...</p>
        </div>
        <Link href="/admin/dashboard" className="text-[10px] text-gray-500 hover:text-white transition uppercase border border-white/10 px-4 py-2 hover:bg-white/5 flex items-center gap-2">
          <ArrowLeft size={14} /> [ Return ]
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-11 gap-12">
        {/* ADD / EDIT FORM (Left) */}
        <div className="xl:col-span-5">
              <section className="p-8 bg-white/[0.02] border border-white/5 rounded-none relative xl:sticky xl:top-12">
                <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-cyan-400/40" />
                <h2 className="text-[10px] font-black mb-8 text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                    {editingId ? <Edit size={12} /> : <PlusCircle size={12} />}
                    {editingId ? "Edit_Entry" : "New_Entry"}
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-[8px] text-gray-600 uppercase mb-2 block tracking-widest">Skill_Name</label>
                    <input className="w-full bg-black/40 border border-white/10 p-4 text-sm font-bold text-white focus:border-cyan-400 outline-none transition-colors" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  
                  <div>
                    <label className="text-[8px] text-gray-600 uppercase mb-2 block tracking-widest">Classification</label>
                    <select className="w-full bg-black/40 border border-white/10 p-4 text-sm text-white focus:border-cyan-400 outline-none transition-colors appearance-none" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                        {categories.map(c => <option key={c} value={c} className="bg-[#020617]">{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between mb-4">
                       <label className="text-[8px] text-gray-600 uppercase tracking-widest">Proficiency_Level</label>
                       <span className="text-cyan-400 text-xs font-black">{form.proficiency}%</span>
                    </div>
                    <input type="range" min={1} max={100} className="w-full h-1 bg-white/5 rounded-none appearance-none cursor-pointer accent-cyan-400" value={form.proficiency} onChange={(e) => setForm({ ...form, proficiency: Number(e.target.value) })} />
                  </div>

                  <button onClick={handleSubmit} disabled={!form.name} className="w-full py-5 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all disabled:opacity-20 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                    {editingId ? "Update_Archive" : "Add_to_Registry"}
                  </button>
                  {editingId && <button onClick={() => { setEditingId(null); setForm(emptyForm); }} className="w-full py-2 text-[10px] text-gray-500 hover:text-white uppercase transition-colors">Discard_Changes</button>}
                </div>
                {status && <p className="mt-8 text-center text-[10px] font-bold text-cyan-400 animate-pulse tracking-widest uppercase">{status}</p>}
              </section>
        </div>

        {/* LIST (Right) */}
        <div className="xl:col-span-6">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                 <h2 className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Collection_Registry</h2>
                 <button onClick={saveOrder} className="text-[10px] text-cyan-400 border border-cyan-400/40 px-4 py-2 hover:bg-cyan-400 hover:text-black transition-all flex items-center gap-2 font-black uppercase tracking-widest">
                    <Save size={12} /> Sync_Order
                 </button>
              </div>

              <Reorder.Group axis="y" values={skills} onReorder={setSkills} className="space-y-3">
                {skills.map((s) => (
                  <Reorder.Item 
                    key={s.id} 
                    value={s} 
                    whileDrag={{ scale: 1.05, boxShadow: "0 10px 40px rgba(0,0,0,0.5)", zIndex: 50, backgroundColor: "rgba(34, 211, 238, 0.05)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="p-6 bg-white/[0.01] border border-white/10 flex items-center gap-6 hover:border-cyan-400/30 transition-colors group cursor-grab active:cursor-grabbing backdrop-blur-sm"
                  >
                    <Move className="text-gray-900 group-hover:text-cyan-400 transition-colors p-1.5 bg-white/5 rounded" size={24} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-sm font-black text-white group-hover:text-cyan-400 transition-colors tracking-tight uppercase truncate">{s.name}</span>
                        <span className="text-[8px] bg-white/5 px-2 py-0.5 text-gray-600 group-hover:text-cyan-400/40 transition-colors uppercase font-mono tracking-widest">{s.category}</span>
                      </div>
                      <div className="h-[2px] w-full bg-white/5">
                        <div className="h-full bg-cyan-400/60 transition-all duration-1000 group-hover:bg-cyan-400" style={{ width: `${s.proficiency}%` }} />
                      </div>
                    </div>

                    <div className="flex gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingId(s.id); setForm({ name: s.name, category: s.category, proficiency: s.proficiency }); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="p-2 text-gray-500 hover:text-white transition-colors"><Edit size={14} /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>

              {skills.length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-white/5 opacity-30">
                   <p className="text-[10px] text-gray-700 uppercase tracking-widest uppercase">No skill data detected.</p>
                </div>
              )}
        </div>
      </div>
    </div>
  );
}
