import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import {
    XIcon,
    BrainIcon,
    ListChecksIcon,
    LightbulbIcon,
    HashIcon,
    Loader2Icon,
} from "lucide-react";

// Clicking an action item cycles its status through this loop.
const NEXT_STATUS = {
    pending: "in_progress",
    in_progress: "done",
    done: "pending",
};

const STATUS_STYLES = {
    pending: "bg-slate-700 text-slate-300",
    in_progress: "bg-amber-500/20 text-amber-400",
    done: "bg-emerald-500/20 text-emerald-400 line-through",
};

const ConversationMemoryPanel = ({ isOpen, onClose }) => {
    const {
        selectedConversation,
        memory,
        isMemoryLoading,
        getMemory,
        toggleActionItem,
    } = useChatStore();

    // Fetch (or refresh) memory whenever the panel opens for a conversation.
    useEffect(() => {
        if (isOpen && selectedConversation?._id) {
            getMemory(selectedConversation._id);
        }
    }, [isOpen, selectedConversation?._id, getMemory]);

    if (!isOpen || !selectedConversation) return null;

    const hasContent =
        memory &&
        (memory.summary ||
            memory.keyDecisions?.length ||
            memory.actionItems?.length ||
            memory.topics?.length);

    return (
        <div className="fixed inset-y-0 right-0 w-80 bg-slate-800 border-l border-slate-700 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                    <BrainIcon className="w-5 h-5 text-violet-400" />
                    AI Memory
                </h2>
                <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 transition-colors"
                >
                    <XIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {isMemoryLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                        <Loader2Icon className="w-6 h-6 animate-spin mb-2" />
                        <p className="text-sm">Loading memory…</p>
                    </div>
                ) : !hasContent ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
                        <BrainIcon className="w-10 h-10 mb-3 opacity-40" />
                        <p className="text-sm">No memory yet.</p>
                        <p className="text-xs mt-1 max-w-[200px]">
                            As this conversation grows, Convo AI builds a summary of
                            decisions, action items, and topics here.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Summary */}
                        {memory.summary && (
                            <section className="space-y-2">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Summary
                                </h4>
                                <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
                                    {memory.summary}
                                </p>
                            </section>
                        )}

                        {/* Key Decisions */}
                        {memory.keyDecisions?.length > 0 && (
                            <section className="space-y-2">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <LightbulbIcon className="w-3.5 h-3.5" /> Key Decisions
                                </h4>
                                <ul className="space-y-2">
                                    {memory.keyDecisions.map((d, i) => (
                                        <li
                                            key={i}
                                            className="text-sm text-slate-300 bg-slate-900/50 rounded-xl p-3 border border-slate-700/50"
                                        >
                                            <p>{d.decision}</p>
                                            {d.madeBy && d.madeBy !== "Unknown" && (
                                                <p className="text-[11px] text-slate-500 mt-1">
                                                    by {d.madeBy}
                                                </p>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Action Items */}
                        {memory.actionItems?.length > 0 && (
                            <section className="space-y-2">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <ListChecksIcon className="w-3.5 h-3.5" /> Action Items
                                </h4>
                                <ul className="space-y-2">
                                    {memory.actionItems.map((a) => (
                                        <li
                                            key={a._id}
                                            className="text-sm text-slate-300 bg-slate-900/50 rounded-xl p-3 border border-slate-700/50 flex items-start justify-between gap-2"
                                        >
                                            <div className="flex-1">
                                                <p className={a.status === "done" ? "line-through text-slate-500" : ""}>
                                                    {a.task}
                                                </p>
                                                {a.assignedTo && a.assignedTo !== "Unassigned" && (
                                                    <p className="text-[11px] text-slate-500 mt-1">
                                                        → {a.assignedTo}
                                                    </p>
                                                )}
                                            </div>
                                            {/* Click to cycle pending → in_progress → done */}
                                            <button
                                                onClick={() =>
                                                    toggleActionItem(
                                                        selectedConversation._id,
                                                        a._id,
                                                        NEXT_STATUS[a.status]
                                                    )
                                                }
                                                className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md whitespace-nowrap transition-colors ${STATUS_STYLES[a.status]}`}
                                                title="Click to change status"
                                            >
                                                {a.status.replace("_", " ")}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Topics */}
                        {memory.topics?.length > 0 && (
                            <section className="space-y-2">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <HashIcon className="w-3.5 h-3.5" /> Topics
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {memory.topics.map((t, i) => (
                                        <span
                                            key={i}
                                            className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20"
                                        >
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ConversationMemoryPanel;
