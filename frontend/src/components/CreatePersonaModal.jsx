import { useState } from "react";
import { usePersonaStore } from "../store/usePersonaStore";
import { XIcon } from "lucide-react";
import toast from "react-hot-toast";

const COLORS = ["#8B5CF6", "#06B6D4", "#F59E0B", "#EF4444", "#10B981", "#EC4899", "#3B82F6"];

// Phase 4: create OR edit a custom persona. Pass `editing` to prefill for edit.
// The parent remounts this (via a `key`) each time it opens, so state initializes
// fresh from `editing` — no effect needed.
const CreatePersonaModal = ({ isOpen, onClose, editing = null }) => {
    const { createPersona, updatePersona } = usePersonaStore();
    const [name, setName] = useState(editing?.name || "");
    const [description, setDescription] = useState(editing?.description || "");
    const [systemPrompt, setSystemPrompt] = useState(editing?.systemPrompt || "");
    const [color, setColor] = useState(editing?.color || COLORS[0]);

    if (!isOpen) return null;

    const handle = name.toLowerCase().replace(/[^a-z0-9]/g, "");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return toast.error("Name is required");
        if (!systemPrompt.trim()) return toast.error("System prompt is required");

        const data = { name: name.trim(), description: description.trim(), systemPrompt: systemPrompt.trim(), color };
        const result = editing
            ? await updatePersona(editing._id, data)
            : await createPersona(data);
        if (result) onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
            <div
                className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-200">
                        {editing ? "Edit Persona" : "Create Persona"}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-700 text-slate-400">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={50}
                            placeholder="e.g. UX Critic"
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500"
                            autoFocus
                        />
                        {handle && (
                            <p className="text-[11px] text-slate-500 mt-1">
                                Mention with <span className="text-violet-400">@{handle}</span>
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={200}
                            placeholder="One line shown in the picker"
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase">Color</label>
                        <div className="flex gap-2 mt-2">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`size-7 rounded-full transition-transform ${color === c ? "ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110" : ""}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase">
                            System Prompt <span className="text-slate-600">(how it behaves)</span>
                        </label>
                        <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            maxLength={4000}
                            rows={6}
                            placeholder="You are a... Respond by..."
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-violet-500 resize-none"
                        />
                        <p className="text-[11px] text-slate-500 mt-1 text-right">{systemPrompt.length}/4000</p>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium hover:from-violet-600 hover:to-purple-700 transition-all"
                    >
                        {editing ? "Save Changes" : "Create Persona"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreatePersonaModal;
