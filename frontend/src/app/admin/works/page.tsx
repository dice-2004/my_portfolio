"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { 
  Move, Edit3, Trash2, X, Plus, Save, ArrowLeft, Hash, 
  Clock, Users, Cpu, Calendar, Layers, Terminal, Globe, 
  ExternalLink, Code2, ChevronLeft 
} from "lucide-react";
import { Reorder } from "framer-motion";
import MarkdownRenderer from "@/components/MarkdownRenderer";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface Work {
  id: number;
  title: string;
  description: string;
  image_url: string;
  github_url: string;
  period: string;
  team: string;
  tech: string;
  display_order: number;
}

const emptyForm = { title: "", description: "", image_url: "", github_url: "", period: "", team: "", tech: "" };

const FullWorkPreview = ({ work }: { work: any }) => {
  // Award Logic
  const awardMatch = work.description.match(/🏆 \*\*AWARD:\*\* (.*)/);
  let award = awardMatch ? awardMatch[1] : null;
  const cleanDesc = work.description.replace(/🏆 \*\*AWARD:\*\* (.*)\n\n/, "");

  return (
    <div className="w-full bg-[#020617] text-white font-mono p-12 border border-white/10 relative overflow-hidden min-h-screen">
      <div className="max-w-6xl mx-auto relative z-10 text-left">
        <div className="mb-16 flex items-center gap-6 opacity-40">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-white/20 flex items-center justify-center"><ChevronLeft size={14} /></div>
              <span className="text-[8px] tracking-[0.2em] uppercase">Return_Index</span>
           </div>
           <div className="h-[1px] flex-1 bg-white/10" />
           <span className="text-[8px] tracking-[0.4em] text-cyan-400 uppercase">[ ARCHIVE_PREVIEW ]</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           <div className="lg:col-span-8 flex flex-col gap-10">
              <div className="bg-white/[0.02] border border-white/5 p-12 relative group shadow-2xl">
                  <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-cyan-400/30" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-cyan-400/30" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-l border-b border-cyan-400/30" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-cyan-400/30" />
                  
                  <div className="flex flex-col gap-8">
                     <div className="flex items-center gap-4 relative">
                        <Hash size={24} className="text-cyan-400" />
                        <h1 className="text-5xl font-black tracking-tighter uppercase leading-none text-white lg:text-7xl">{work.title || "UNTITLED"}</h1>
                        <div className="absolute inset-0 pointer-events-none overflow-hidden h-[180%] top-[-40%]">
                           <div className="w-full h-[1px] bg-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.2)] animate-scan-v" />
                        </div>
                     </div>
                     {award && (
                        <div className="px-4 py-1.5 w-fit bg-cyan-400/10 border border-cyan-400/40 text-cyan-400 text-[10px] font-black tracking-widest uppercase rounded-full flex items-center gap-3">
                           <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />{award}
                        </div>
                     )}
                     <div className="prose prose-invert prose-sm max-w-none 
                        prose-h3:text-cyan-400 prose-h3:text-[10px] prose-h3:uppercase prose-h3:tracking-[0.3em] prose-p:text-gray-400 prose-p:leading-relaxed">
                        <MarkdownRenderer content={cleanDesc || "_Enter field data to begin stream..._"} />
                     </div>
                  </div>
              </div>
           </div>
           <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white/[0.03] border border-white/10 p-10 relative">
                  <h3 className="text-[10px] font-mono text-cyan-400 mb-8 tracking-[0.4em] uppercase underline decoration-cyan-400/20 underline-offset-8">Spec_Sheet</h3>
                  <div className="space-y-8">
                     <div>
                        <div className="flex items-center gap-3 mb-2 text-gray-700"><Calendar size={14} /><span className="text-[8px] uppercase tracking-widest">&gt; Timestamp</span></div>
                        <p className="font-black text-xl text-white">[{work.period || "XXXX.XX"}]</p>
                     </div>
                     <div>
                        <div className="flex items-center gap-3 mb-2 text-gray-700"><Layers size={14} /><span className="text-[8px] uppercase tracking-widest">&gt; Organization</span></div>
                        <p className="font-black text-lg text-white">{work.team || "Personal"}</p>
                     </div>
                     <div>
                        <div className="flex items-center gap-3 mb-3 text-cyan-400/40"><Terminal size={14} /><span className="text-[8px] uppercase tracking-widest">&gt; Tech_Stack</span></div>
                        <ul className="flex flex-wrap gap-2">
                          {(work.tech || "None").split(/[,、] ?/).map((t: string, i: number) => (
                             <li key={i} className="px-2 py-1 bg-white/[0.03] border border-white/10 text-[9px] font-mono text-gray-400">{t.trim()}</li>
                          ))}
                        </ul>
                     </div>
                  </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminWorksPage() {
  const [token, setToken]       = useState("");
  const [works, setWorks]       = useState<Work[]>([]);
  const [form, setForm]         = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [status, setStatus]     = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("admin_token") ?? "";
    setToken(t);
    if (!t) { window.location.href = "/admin"; return; }
    fetchWorks(t);
  }, []);

  const authFetch = (url: string, options: RequestInit = {}, t = token) =>
    fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${t}`,
        ...options.headers,
      },
    });

  const fetchWorks = async (t: string) => {
    const res = await fetch("http://localhost:8080/api/works");
    if (res.ok) {
       const data = await res.json();
       setWorks(data.sort((a: any, b: any) => a.display_order - b.display_order));
    }
  };

  const saveOrder = async () => {
    const orderData = works.map((w, i) => ({ id: w.id, order: i }));
    const res = await authFetch("http://localhost:8080/api/admin/works/order", {
       method: "PUT",
       body: JSON.stringify(orderData)
    });
    if (res.ok) {
       setStatus("✅ Database order synchronized.");
       fetchWorks(token);
    } else {
       setStatus("❌ Synchronization error.");
    }
    setTimeout(() => setStatus(""), 3000);
  };

  const handleSubmit = async () => {
    const isEditing = editingId !== null;
    const url = isEditing
      ? `http://localhost:8080/api/admin/works/${editingId}`
      : "http://localhost:8080/api/admin/works";

    const res = await authFetch(url, {
      method: isEditing ? "PUT" : "POST",
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setStatus(isEditing ? "✅ Data patch successful." : "✅ New item archived.");
      setForm(emptyForm);
      setEditingId(null);
      fetchWorks(token);
    } else {
      setStatus("❌ Archival process failed.");
    }
    setTimeout(() => setStatus(""), 3000);
  };

  const handleEdit = (work: Work) => {
    setEditingId(work.id);
    setForm({
      title: work.title,
      description: work.description,
      image_url: work.image_url ?? "",
      github_url: work.github_url ?? "",
      period: work.period ?? "",
      team: work.team ?? "",
      tech: work.tech ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Confirm data deletion? This action is irreversible.")) return;
    const res = await authFetch(`http://localhost:8080/api/admin/works/${id}`, { method: "DELETE" });
    if (res.ok) {
      setStatus("🗑️ Item purged from archive.");
      fetchWorks(token);
    }
    setTimeout(() => setStatus(""), 3000);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-mono p-6 md:p-12 selection:bg-cyan-500 selection:text-black">
      <div className="max-w-screen-2xl mx-auto">
        
        {/* Navigation Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16 border-b border-white/5 pb-8">
          <div>
             <h1 className="text-3xl font-black tracking-tighter text-white inline-flex items-center gap-4 uppercase">
               <Edit3 className="text-cyan-400" size={24} /> 
               Work_Specimen_Manager
             </h1>
             <p className="text-[10px] text-gray-500 mt-2 tracking-[0.3em] uppercase opacity-60">System Version 4.3.5-Stable // User: Admin_Daisuke</p>
          </div>
          <Link href="/admin/dashboard" className="px-6 py-3 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/5 transition-all flex items-center gap-3 w-fit">
            <ArrowLeft size={14} /> [ Return_to_Root ]
          </Link>
        </div>

        {previewMode && (
          <div className="mb-12 animate-in zoom-in-95 duration-500 relative">
             <button 
                onClick={() => setPreviewMode(false)}
                className="absolute top-6 right-6 z-50 p-4 bg-white text-black font-black uppercase text-[10px] tracking-widest hover:bg-cyan-400 transition-all flex items-center gap-2"
             >
                <X size={16} /> Exit_Preview
             </button>
             <FullWorkPreview work={form} />
          </div>
        )}

        <div className={`grid grid-cols-1 gap-16 items-start ${previewMode ? 'hidden' : 'xl:grid-cols-12'}`}>
          
          {/* ARCHIVAL FORM (Left Column) */}
          <section className="xl:col-span-12 2xl:col-span-7 bg-white/[0.02] border border-white/5 p-10 relative group">
            <div className="absolute top-0 left-0 w-6 h-[1px] bg-cyan-400" />
            <div className="absolute top-0 left-0 w-[1px] h-6 bg-cyan-400" />
            
            <div className="flex justify-between items-start mb-10">
               <h2 className="text-xs font-black text-cyan-400 opacity-80 uppercase tracking-[0.4em] flex items-center gap-3">
                  {editingId ? <Edit3 size={14} /> : <Plus size={14} />}
                  {editingId ? `Update_Entry: LOG_${editingId.toString().padStart(3, '0')}` : "Archive_New_Specimen"}
               </h2>
               <button 
                  onClick={() => setPreviewMode(true)}
                  className="px-6 py-2 border border-cyan-400/40 text-cyan-400 text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-400 hover:text-black transition-all"
               >
                  Full_Visual_Preview
               </button>
            </div>

            <div className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2 group/field">
                       <label className="block text-[8px] text-gray-600 uppercase mb-2 tracking-widest font-black">Specimen_Title</label>
                       <input
                        className="w-full bg-black/40 border border-white/10 p-5 text-lg font-black text-white outline-none focus:border-cyan-400 transition-all uppercase tracking-tight shadow-inner"
                        placeholder="UNTITLED"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                      />
                    </div>

                    <div className="group/field">
                       <label className="block text-[8px] text-gray-600 uppercase mb-2 tracking-widest font-black flex items-center gap-2">
                          <Clock size={10} /> Period / Year
                       </label>
                       <input
                        className="w-full bg-black/40 border border-white/10 p-4 text-xs font-bold text-white outline-none focus:border-cyan-400 transition-all"
                        placeholder="e.g. 2024.03 - 2024.05"
                        value={form.period}
                        onChange={(e) => setForm({ ...form, period: e.target.value })}
                      />
                    </div>
                    <div className="group/field">
                       <label className="block text-[8px] text-gray-600 uppercase mb-2 tracking-widest font-black flex items-center gap-2">
                          <Users size={10} /> Team Structure
                       </label>
                       <input
                        className="w-full bg-black/40 border border-white/10 p-4 text-xs font-bold text-white outline-none focus:border-cyan-400 transition-all"
                        placeholder="e.g. 5-person team (Leader)"
                        value={form.team}
                        onChange={(e) => setForm({ ...form, team: e.target.value })}
                      />
                    </div>

                    <div className="group/field">
                       <label className="block text-[8px] text-gray-600 uppercase mb-2 tracking-widest font-black flex items-center gap-2">
                          <Hash size={10} /> Github_Repo_URI
                       </label>
                       <input
                        className="w-full bg-black/40 border border-white/10 p-4 text-[10px] font-mono text-cyan-400 outline-none focus:border-cyan-400 transition-all"
                        placeholder="https://github.com/..."
                        value={form.github_url}
                        onChange={(e) => setForm({ ...form, github_url: e.target.value })}
                      />
                    </div>
                    <div className="group/field">
                       <label className="block text-[8px] text-gray-600 uppercase mb-2 tracking-widest font-black flex items-center gap-2">
                          <Cpu size={10} /> Technology_Stack (Keywords)
                       </label>
                       <input
                        className="w-full bg-black/40 border border-white/10 p-4 text-[10px] font-mono text-white outline-none focus:border-cyan-400 transition-all"
                        placeholder="Next.js, Go, SQLite, Framer Motion"
                        value={form.tech}
                        onChange={(e) => setForm({ ...form, tech: e.target.value })}
                      />
                    </div>

                    <div className="md:col-span-2 group/field">
                       <label className="block text-[8px] text-gray-600 uppercase mb-2 tracking-widest font-black">Laboratory_Notes_MD</label>
                       <div data-color-mode="dark" className="border border-white/10 overflow-hidden">
                        <MDEditor
                          value={form.description}
                          onChange={(v) => setForm({ ...form, description: v ?? "" })}
                          height={400}
                          preview="edit"
                        />
                      </div>
                    </div>
                 </div>

               <div className="flex gap-4 pt-10 mt-10 border-t border-white/5">
                  <button
                    onClick={handleSubmit}
                    disabled={!form.title || !form.description}
                    className="flex-1 py-6 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all disabled:opacity-20 shadow-[0_0_40px_rgba(255,255,255,0.05)] hover:shadow-cyan-400/20 active:scale-[0.99]"
                  >
                    {editingId ? "Commit_Encrypted_Patch" : "Initialize_Deep_Storage_Link"}
                  </button>
                  {editingId && (
                    <button
                      onClick={() => { setEditingId(null); setForm(emptyForm); }}
                      className="px-10 py-6 border border-white/10 text-white hover:bg-red-500/10 hover:border-red-500/50 transition-all group/cancel"
                    >
                      <X className="group-hover/cancel:rotate-90 transition-transform" size={20} />
                    </button>
                  )}
               </div>
               
               {status && (
                 <div className="p-4 border border-cyan-400/20 bg-cyan-400/5 text-center mt-6">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.3em] animate-pulse">{status}</span>
                 </div>
               )}
            </div>
          </section>

          {/* INDEX PANEL (Right Column) */}
          <section className="xl:col-span-12 2xl:col-span-5 flex flex-col gap-8">
             <div className="flex items-end justify-between border-b border-white/5 pb-6">
                <div>
                   <h2 className="text-xs font-black text-white/40 uppercase tracking-[0.4em]">Archive_Registry</h2>
                   <p className="text-[10px] text-gray-600 mt-1 uppercase">Allocated_Slots: {works.length}/256</p>
                </div>
                <button 
                  onClick={saveOrder}
                  className="px-8 py-3 bg-transparent border border-cyan-400 text-cyan-400 text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 hover:text-black transition-all flex items-center gap-3 drop-shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                >
                  <Save size={14} /> Synchronize_Order
                </button>
             </div>

             <Reorder.Group axis="y" values={works} onReorder={setWorks} className="space-y-4">
                {works.map((work) => (
                  <Reorder.Item 
                    key={work.id} 
                    value={work} 
                    whileDrag={{ 
                      scale: 1.05, 
                      backgroundColor: "rgba(34, 211, 238, 0.05)",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                      zIndex: 100
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="group relative p-8 bg-white/[0.01] border border-white/10 hover:border-cyan-400/30 transition-colors flex items-center justify-between cursor-grab active:cursor-grabbing backdrop-blur-sm"
                  >
                     <div className="flex items-center gap-8">
                        <Move className="text-gray-900 group-hover:text-cyan-400 transition-colors p-2 bg-white/5 rounded" size={32} />
                        <div className="min-w-0">
                           <div className="flex items-center gap-4 mb-2">
                              <h3 className="text-base font-black text-white group-hover:text-cyan-400 transition-colors tracking-tight uppercase truncate max-w-[300px]">
                                {work.title}
                              </h3>
                           </div>
                           <div className="flex items-center gap-4 text-[8px] text-gray-700 font-mono tracking-widest uppercase">
                              <span>ID: {work.id.toString().padStart(3, '0')}</span>
                              <span className="opacity-30">|</span>
                              <span>{work.period || "NO_DATE"}</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-2 opacity-20 group-hover:opacity-100 transition-all">
                        <button 
                           onClick={() => handleEdit(work)}
                           className="p-4 bg-white/5 hover:bg-white/10 text-white transition-all text-[8px] font-black uppercase tracking-widest"
                        >
                           <Edit3 size={16} />
                        </button>
                        <button 
                           onClick={() => handleDelete(work.id)}
                           className="p-4 bg-red-500/5 hover:bg-red-500/20 text-red-500 transition-all text-[8px] font-black uppercase tracking-widest border border-transparent"
                        >
                           <Trash2 size={16} />
                        </button>
                     </div>
                  </Reorder.Item>
                ))}

                {works.length === 0 && (
                  <div className="py-32 text-center border-2 border-dashed border-white/5">
                     <p className="text-[10px] text-gray-700 uppercase tracking-widest whitespace-pre-wrap leading-loose">【 Await_Connection 】\nNo archival specimen detected.</p>
                  </div>
                )}
             </Reorder.Group>
          </section>
        </div>

      </div>
    </div>
  );
}
