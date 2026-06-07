import { useState } from "react";
import { usePersonaStore } from "../store/usePersonaStore";
import { XIcon } from "lucide-react";
import toast from "react-hot-toast";
import { C } from "../lib/theme";

const COLORS = ["#8B5CF6", "#06B6D4", "#F59E0B", "#EF4444", "#10B981", "#EC4899", "#3B82F6"];

// Phase 4: create OR edit a custom persona. Pass `editing` to prefill for edit.
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
        const result = editing ? await updatePersona(editing._id, data) : await createPersona(data);
        if (result) onClose();
    };

    const inputStyle = { background: C.panelAlt, borderColor: C.border, color: C.text };
    const labelCls = "text-xs font-semibold uppercase";

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
            <div
                className="flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl border shadow-2xl"
                style={{ background: C.panel, borderColor: C.border }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b p-4" style={{ borderColor: C.border }}>
                    <h2 className="text-lg font-bold" style={{ color: C.text }}>
                        {editing ? "Edit Persona" : "Create Persona"}
                    </h2>
                    <button onClick={onClose} className="rounded-lg p-1" style={{ color: C.muted }}>
                        <XIcon className="size-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto p-4">
                    <div>
                        <label className={labelCls} style={{ color: C.muted }}>Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={50}
                            placeholder="e.g. UX Critic"
                            className="mt-1 w-full rounded-xl border px-3 py-2 outline-none"
                            style={inputStyle}
                            autoFocus
                        />
                        {handle && (
                            <p className="mt-1 text-[11px]" style={{ color: C.muted }}>
                                Mention with <span style={{ color: C.teal }}>@{handle}</span>
                            </p>
                        )}
                    </div>

                    <div>
                        <label className={labelCls} style={{ color: C.muted }}>Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={200}
                            placeholder="One line shown in the picker"
                            className="mt-1 w-full rounded-xl border px-3 py-2 outline-none"
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label className={labelCls} style={{ color: C.muted }}>Color</label>
                        <div className="mt-2 flex gap-2">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className="size-7 rounded-full transition-transform"
                                    style={{ backgroundColor: c, transform: color === c ? "scale(1.15)" : "none", boxShadow: color === c ? `0 0 0 2px ${C.panel}, 0 0 0 4px ${c}` : "none" }}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className={labelCls} style={{ color: C.muted }}>
                            System Prompt <span style={{ color: C.muted, opacity: 0.7 }}>(how it behaves)</span>
                        </label>
                        <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            maxLength={4000}
                            rows={6}
                            placeholder="You are a... Respond by..."
                            className="mt-1 w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none"
                            style={inputStyle}
                        />
                        <p className="mt-1 text-right text-[11px]" style={{ color: C.muted }}>{systemPrompt.length}/4000</p>
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-xl py-2.5 font-medium transition-opacity hover:opacity-90"
                        style={{ background: C.teal, color: C.onAccent }}
                    >
                        {editing ? "Save Changes" : "Create Persona"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreatePersonaModal;
