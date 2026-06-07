import { useEffect, useState } from "react";
import { usePersonaStore } from "../store/usePersonaStore";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { X, Plus, Pencil, Trash2, Bot } from "lucide-react";
import CreatePersonaModal from "./CreatePersonaModal";
import { C } from "../lib/theme";

// Phase 4: pick which AI personas are active (and appear in @mention autocomplete)
// for the selected conversation. Also create/edit/delete your own personas.
const PersonaSelector = ({ isOpen, onClose }) => {
    const { personas, getPersonas, deletePersona, handleOf } = usePersonaStore();
    const { selectedConversation, setConversationPersonas } = useChatStore();
    const { authUser } = useAuthStore();
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    useEffect(() => {
        if (isOpen) getPersonas();
    }, [isOpen, getPersonas]);

    if (!isOpen || !selectedConversation) return null;

    const enabledIds = (selectedConversation.personas || []).map((p) => p._id || p);

    const toggle = (personaId) => {
        const next = enabledIds.includes(personaId)
            ? enabledIds.filter((id) => id !== personaId)
            : [...enabledIds, personaId];
        setConversationPersonas(selectedConversation._id, next);
    };

    const openCreate = () => { setEditing(null); setModalOpen(true); };
    const openEdit = (p) => { setEditing(p); setModalOpen(true); };

    return (
        <>
            <div
                className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l shadow-2xl"
                style={{ background: C.panel, borderColor: C.border }}
            >
                <div className="flex items-center justify-between border-b p-4" style={{ borderColor: C.border }}>
                    <h2 className="flex items-center gap-2 text-lg font-semibold" style={{ color: C.text }}>
                        <Bot className="size-5" style={{ color: C.teal }} /> AI Personas
                    </h2>
                    <button onClick={onClose} className="rounded-lg p-1" style={{ color: C.muted }}>
                        <X className="size-5" />
                    </button>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    <p className="text-xs" style={{ color: C.muted }}>
                        Toggle personas on for this chat, then summon them with their{" "}
                        <span style={{ color: C.teal }}>@mention</span>. If none are on, the default personas stay available.
                    </p>

                    {personas.map((p) => {
                        const enabled = enabledIds.includes(p._id);
                        const isOwner = !p.isDefault && p.createdBy === authUser?._id;
                        return (
                            <div
                                key={p._id}
                                className="flex items-start gap-3 rounded-lg border p-3"
                                style={{ background: C.deep, borderColor: enabled ? C.teal : C.border }}
                            >
                                <span className="mt-1 size-3 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="truncate text-sm font-medium" style={{ color: C.text }}>{p.name}</span>
                                        <button
                                            onClick={() => toggle(p._id)}
                                            className="relative h-5 w-9 shrink-0 rounded-full transition-colors"
                                            style={{ background: enabled ? C.teal : C.active }}
                                            title={enabled ? "Enabled" : "Disabled"}
                                        >
                                            <span
                                                className="absolute top-0.5 size-4 rounded-full transition-all"
                                                style={{ left: enabled ? 18 : 2, background: enabled ? C.panel : C.muted }}
                                            />
                                        </button>
                                    </div>
                                    <p className="mt-0.5 text-[11px]" style={{ color: C.teal }}>@{handleOf(p.name)}</p>
                                    {p.description && <p className="mt-1 text-xs" style={{ color: C.muted }}>{p.description}</p>}
                                    {isOwner && (
                                        <div className="mt-2 flex gap-3">
                                            <button onClick={() => openEdit(p)} className="flex items-center gap-1 text-[11px]" style={{ color: C.muted }}>
                                                <Pencil className="size-3" /> Edit
                                            </button>
                                            <button onClick={() => deletePersona(p._id)} className="flex items-center gap-1 text-[11px]" style={{ color: "#e06c75" }}>
                                                <Trash2 className="size-3" /> Delete
                                            </button>
                                        </div>
                                    )}
                                    {p.isDefault && (
                                        <span className="mt-2 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ background: C.active, color: C.muted }}>
                                            Default
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    <button
                        onClick={openCreate}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-2.5 text-sm transition-colors"
                        style={{ borderColor: C.border, color: C.muted }}
                    >
                        <Plus className="size-4" /> Create custom persona
                    </button>
                </div>
            </div>

            {modalOpen && (
                <CreatePersonaModal
                    key={editing?._id || "new"}
                    isOpen={true}
                    onClose={() => setModalOpen(false)}
                    editing={editing}
                />
            )}
        </>
    );
};

export default PersonaSelector;
