"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { 
  Move, Edit3, Trash2, X, Plus, Save, ArrowLeft, Hash, 
  Clock, Calendar, Layers, Terminal, ChevronLeft 
} from "lucide-react";
import { Reorder } from "framer-motion";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

interface Timeline { 
  id: number; 
  title: string; 
  description: string; 
  event_date: string; 
  category: string; 
  display_order: number; 
}

const emptyForm = { 
  title: "", 
  description: "", 
  event_date: new Date().toISOString().split('T')[0], 
  category: "Work", 
  display_order: 1 
};

export default function AdminTimelinePage() {
  const [token, setToken]       = useState("");
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [form, setForm]         = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [status, setStatus]     = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("admin_token") ?? "";
    if (!t) { 
      window.location.href = "/admin"; 
      return; 
    }
    setToken(t);
    fetchTimelines();
  }, []);

  const authFetch = (url: string, options: RequestInit = {}) =>
    fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token || localStorage.getItem("admin_token")}`,
        ...options.headers,
      },
    });

  const fetchTimelines = async () => {
    try {
      const res = await fetch("/api/timeline");
      if (res.ok) {
        const data = await res.json();
        setTimelines(Array.isArray(data) ? data.sort((a, b) => a.display_order - b.display_order) : []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleSubmit = async () => {
    const isEditing = editingId !== null;
    const url = isEditing ? `/api/admin/timeline/${editingId}` : "/api/admin/timeline";
    
    try {
      const res = await authFetch(url, { 
        method: isEditing ? "PUT" : "POST", 
        body: JSON.stringify(form) 
      });
      
      if (res.ok) {
        setStatus(isEditing ? "✅ Record updated." : "✅ New event archived.");
        setForm(emptyForm);
        setEditingId(null);
        fetchTimelines();
      } else {
        setStatus("❌ Operation failed.");
      }
    } catch (err) {
      setStatus("❌ Network error.");
    }
    setTimeout(() => setStatus(""), 3000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Confirm record deletion?")) return;
    try {
      const res = await authFetch(`/api/admin/timeline/${id}`, { method: "DELETE" });
      if (res.ok) {
        setStatus("🗑️ Event purged.");
        fetchTimelines();
      }
    } catch (err) {
      setStatus("❌ Deletion failed.");
    }
    setTimeout(() => setStatus(""), 3000);
  };

  const handleEdit = (t: Timeline) => {
    setEditingId(t.id);
    setForm({
      title: t.title,
      description: t.description,
      event_date: t.event_date,
      category: t.category,
      display_order: t.display_order,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-mono p-6 md:p-12 selection:bg-cyan-500 selection:text-black">
      <div className="max-w-screen-2xl mx-auto">
        
        {/* Navigation Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16 border-b border-white/5 pb-8">
          <div>
             <h1 className="text-3xl font-black tracking-tighter text-white inline-flex items-center gap-4 uppercase">
               <Clock className="text-cyan-400" size={24} /> 
               Timeline_Registry_Manager
             </h1>
             <p className="text-[10px] text-gray-500 mt-2 tracking-[0.3em] uppercase opacity-60">System Version 4.3.5-Stable // Chronos_Auth</p>
          </div>
          <Link href="/admin/dashboard" className="px-6 py-3 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/5 transition-all flex items-center gap-3 w-fit">
            <ArrowLeft size={14} /> [ Return_to_Root ]
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-16 items-start xl:grid-cols-12">
          
          {/* Timeline Entry Form (Left Column) */}
          <section className="xl:col-span-12 2xl:col-span-7 bg-white/[0.02] border border-white/5 p-10 relative group">
            <div className="absolute top-0 left-0 w-6 h-[1px] bg-cyan-400" />
            <div className="absolute top-0 left-0 w-[1px] h-6 bg-cyan-400" />
            
            <div className="flex justify-between items-start mb-10">
               <h2 className="text-xs font-black text-cyan-400 opacity-80 uppercase tracking-[0.4em] flex items-center gap-3">
                  {editingId ? <Edit3 size={14} /> : <Plus size={14} />}
                  {editingId ? `Update_Event: EVT_${editingId.toString().padStart(3, '0')}` : "Register_New_Event"}
               </h2>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 group/field">
                   <label className="block text-[8px] text-gray-600 uppercase mb-2 tracking-widest font-black">Event_Title</label>
                   <input
                    className="w-full bg-black/40 border border-white/10 p-5 text-lg font-black text-white outline-none focus:border-cyan-400 transition-all uppercase tracking-tight shadow-inner"
                    placeholder="UNTITLED_EVENT"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="group/field">
                   <label className="block text-[8px] text-gray-600 uppercase mb-2 tracking-widest font-black flex items-center gap-2">
                      <Calendar size={10} /> Date_Timestamp
                   </label>
                   <input
                    type="date"
                    className="w-full bg-black/40 border border-white/10 p-4 text-[10px] font-mono text-white outline-none focus:border-cyan-400 transition-all uppercase"
                    value={form.event_date}
                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  />
                </div>

                <div className="group/field">
                   <label className="block text-[8px] text-gray-600 uppercase mb-2 tracking-widest font-black flex items-center gap-2">
                      <Layers size={10} /> Category_Tag
                   </label>
                   <input
                    className="w-full bg-black/40 border border-white/10 p-4 text-[10px] font-mono text-white outline-none focus:border-cyan-400 transition-all uppercase"
                    placeholder="Work / Project / Life"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2 group/field">
                   <label className="block text-[8px] text-gray-600 uppercase mb-2 tracking-widest font-black">Event_Data_Log (Markdown)</label>
                   <div data-color-mode="dark" className="border border-white/10 overflow-hidden">
                    <MDEditor
                      value={form.description}
                      onChange={(v) => {
                         const normalized = (v ?? "").replace(/\r\n/g, "\n");
                         setForm({ ...form, description: normalized });
                      }}
                      height={250}
                      preview="edit"
                      textareaProps={{
                        style: {
                          fontVariantLigatures: "none",
                          fontFeatureSettings: "normal",
                          letterSpacing: "0",
                          lineHeight: "1.6",
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-10 mt-10 border-t border-white/5">
               <button
                 onClick={handleSubmit}
                 disabled={!form.title}
                 className="flex-1 py-6 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all disabled:opacity-20 shadow-[0_0_40px_rgba(255,255,255,0.05)]"
               >
                 {editingId ? "Commit_Archive_Patch" : "Initialize_Timeline_Record"}
               </button>
               {editingId && (
                 <button
                   onClick={() => { setEditingId(null); setForm(emptyForm); }}
                   className="px-10 py-6 border border-white/10 text-white hover:bg-red-500/10 transition-all"
                 >
                   <X size={20} />
                 </button>
               )}
            </div>
            
            {status && (
              <div className="p-4 border border-cyan-400/20 bg-cyan-400/5 text-center mt-6">
                 <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.3em]">{status}</span>
              </div>
            )}
          </section>

          {/* Registry Registry (Right Column) */}
          <section className="xl:col-span-12 2xl:col-span-5 flex flex-col gap-8">
             <div className="flex items-end justify-between border-b border-white/5 pb-6">
                <div>
                   <h2 className="text-xs font-black text-white/40 uppercase tracking-[0.4em]">Event_Log_Archive</h2>
                   <p className="text-[10px] text-gray-600 mt-1 uppercase">Stored_Sequences: {timelines.length}</p>
                </div>
             </div>

             <div className="space-y-4">
                {timelines.map((t) => (
                   <div key={t.id} className="group relative p-6 bg-white/[0.01] border border-white/10 hover:border-cyan-400/30 transition-colors flex items-center justify-between backdrop-blur-sm">
                      <div className="flex items-center gap-6">
                         <div className="text-[10px] font-mono text-gray-700 bg-white/5 px-3 py-1 uppercase tracking-tighter">
                            {t.event_date}
                         </div>
                         <div className="min-w-0">
                            <h3 className="text-sm font-black text-white group-hover:text-cyan-400 transition-colors tracking-tight uppercase truncate max-w-[200px]">
                              {t.title}
                            </h3>
                            <div className="text-[8px] text-gray-700 font-mono tracking-widest uppercase mt-1">
                               {t.category}
                            </div>
                         </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-20 group-hover:opacity-100 transition-all">
                         <button 
                            onClick={() => handleEdit(t)}
                            className="p-3 bg-white/5 hover:bg-white/10 text-white transition-all"
                         >
                            <Edit3 size={14} />
                         </button>
                         <button 
                            onClick={() => handleDelete(t.id)}
                            className="p-3 bg-red-500/5 hover:bg-red-500/20 text-red-500 transition-all border border-transparent"
                         >
                            <Trash2 size={14} />
                         </button>
                      </div>
                   </div>
                ))}

                {timelines.length === 0 && (
                  <div className="py-20 text-center border border-dashed border-white/5 opacity-30">
                     <p className="text-[8px] uppercase tracking-[0.4em]">No archival sequences found.</p>
                  </div>
                )}
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}
