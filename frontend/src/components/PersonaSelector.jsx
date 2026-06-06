import { useEffect, useState } from "react";
import { usePersonaStore } from "../store/usePersonaStore";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { XIcon, PlusIcon, PencilIcon, Trash2Icon, BotIcon } from "lucide-react";
import CreatePersonaModal from "./CreatePersonaModal";

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

    // Which personas are explicitly enabled on this conversation right now?
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
            <div className="fixed inset-y-0 right-0 w-80 bg-slate-800 border-l border-slate-700 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
                    <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                        <BotIcon className="w-5 h-5 text-violet-400" /> AI Personas
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-700 text-slate-400">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    <p className="text-xs text-slate-500">
                        Toggle personas on for this chat, then summon them with their{" "}
                        <span className="text-violet-400">@mention</span>. If none are on, the
                        default personas stay available.
                    </p>

                    {personas.map((p) => {
                        const enabled = enabledIds.includes(p._id);
                        const isOwner = !p.isDefault && p.createdBy === authUser?._id;
                        return (
                            <div
                                key={p._id}
                                className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50 flex items-start gap-3"
                            >
                                <span className="size-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: p.color }} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-medium text-slate-200 truncate">{p.name}</span>
                                        {/* on/off toggle */}
                                        <button
                                            onClick={() => toggle(p._id)}
                                            className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${enabled ? "bg-violet-500" : "bg-slate-600"}`}
                                            title={enabled ? "Enabled" : "Disabled"}
                                        >
                                            <span className={`absolute top-0.5 size-4 bg-white rounded-full transition-all ${enabled ? "left-4" : "left-0.5"}`} />
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-violet-400/80 mt-0.5">@{handleOf(p.name)}</p>
                                    {p.description && (
                                        <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                                    )}
                                    {isOwner && (
                                        <div className="flex gap-3 mt-2">
                                            <button onClick={() => openEdit(p)} className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1">
                                                <PencilIcon className="w-3 h-3" /> Edit
                                            </button>
                                            <button onClick={() => deletePersona(p._id)} className="text-[11px] text-slate-400 hover:text-red-400 flex items-center gap-1">
                                                <Trash2Icon className="w-3 h-3" /> Delete
                                            </button>
                                        </div>
                                    )}
                                    {p.isDefault && (
                                        <span className="inline-block mt-2 text-[9px] uppercase font-bold tracking-wide text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">Default</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    <button
                        onClick={openCreate}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-600 text-slate-400 hover:text-violet-400 hover:border-violet-500 transition-colors text-sm"
                    >
                        <PlusIcon className="w-4 h-4" /> Create custom persona
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
