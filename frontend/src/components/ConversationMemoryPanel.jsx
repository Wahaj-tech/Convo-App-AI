import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import {
    X,
    BrainCircuit,
    ListChecks,
    Lightbulb,
    Tag,
    Loader2,
    Plus,
    RefreshCw,
} from "lucide-react";
import { C } from "../lib/theme";

// Clicking an action item cycles its status through this loop.
const NEXT_STATUS = {
    pending: "in_progress",
    in_progress: "done",
    done: "pending",
};

const STATUS_STYLES = {
    pending: { background: C.active, color: C.muted },
    in_progress: { background: "rgba(217,164,6,0.15)", color: "#d9a406" },
    done: { background: "rgba(234,88,12,0.15)", color: C.teal },
};

const ConversationMemoryPanel = ({ isOpen, onClose }) => {
    const { selectedConversation, memory, isMemoryLoading, getMemory, toggleActionItem, addActionItem, regenerateMemory } = useChatStore();
    const [newTask, setNewTask] = useState("");

    useEffect(() => {
        if (isOpen && selectedConversation?._id) getMemory(selectedConversation._id);
    }, [isOpen, selectedConversation?._id, getMemory]);

    if (!isOpen || !selectedConversation) return null;

    const handleAdd = async (e) => {
        e?.preventDefault();
        if (!newTask.trim()) return;
        await addActionItem(selectedConversation._id, { task: newTask.trim() });
        setNewTask("");
    };

    const hasContent =
        memory &&
        (memory.summary || memory.keyDecisions?.length || memory.actionItems?.length || memory.topics?.length);

    return (
        <div
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l shadow-2xl"
            style={{ background: C.panel, borderColor: C.border }}
        >
            {/* header */}
            <div className="flex items-center justify-between border-b p-4" style={{ borderColor: C.border }}>
                <h2 className="flex items-center gap-2 text-lg font-semibold" style={{ color: C.text }}>
                    <BrainCircuit className="size-5" style={{ color: C.teal }} />
                    Conversation Memory
                </h2>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => regenerateMemory(selectedConversation._id)}
                        disabled={isMemoryLoading}
                        className="rounded-lg p-1.5 disabled:opacity-50"
                        style={{ color: C.muted }}
                        title="Regenerate memory from the conversation"
                    >
                        <RefreshCw className={`size-4 ${isMemoryLoading ? "animate-spin" : ""}`} />
                    </button>
                    <button onClick={onClose} className="rounded-lg p-1" style={{ color: C.muted }}>
                        <X className="size-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-4">
                {isMemoryLoading ? (
                    <div className="flex flex-col items-center justify-center py-16" style={{ color: C.muted }}>
                        <Loader2 className="mb-2 size-6 animate-spin" />
                        <p className="text-sm">Loading memory…</p>
                    </div>
                ) : (
                    <>
                        {!hasContent && (
                            <p className="text-xs" style={{ color: C.muted }}>
                                No AI memory yet — it builds as the conversation grows. You can still add action items by hand below.
                            </p>
                        )}
                        {/* summary */}
                        {memory?.summary && (
                            <section className="space-y-2">
                                <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
                                    Rolling Summary
                                </h4>
                                <p
                                    className="rounded-lg border border-l-2 p-3 text-sm leading-relaxed"
                                    style={{ background: C.deep, borderColor: C.border, borderLeftColor: C.teal, color: C.text }}
                                >
                                    {memory.summary}
                                </p>
                            </section>
                        )}

                        {/* topics */}
                        {memory?.topics?.length > 0 && (
                            <section className="space-y-2">
                                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
                                    <Tag className="size-3.5" /> Topics
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {memory.topics.map((t, i) => (
                                        <span
                                            key={i}
                                            className="rounded border px-2.5 py-1 text-xs"
                                            style={{ background: C.active, borderColor: C.border, color: C.text }}
                                        >
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* key decisions */}
                        {memory?.keyDecisions?.length > 0 && (
                            <section className="space-y-2">
                                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
                                    <Lightbulb className="size-3.5" /> Key Decisions
                                </h4>
                                <ul className="space-y-2">
                                    {memory.keyDecisions.map((d, i) => (
                                        <li key={i} className="rounded-lg border p-3 text-sm" style={{ background: C.deep, borderColor: C.border, color: C.text }}>
                                            {/* AI-suggested decisions are tagged distinctly from team decisions */}
                                            <span
                                                className="mb-1 inline-block rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                                                style={
                                                    d.source === "ai"
                                                        ? { background: "rgba(139,92,246,0.18)", color: "#8b5cf6" }
                                                        : { background: "rgba(234,88,12,0.2)", color: C.teal }
                                                }
                                            >
                                                {d.source === "ai" ? "AI Suggestion" : "Decision"}
                                            </span>
                                            <p>{d.decision}</p>
                                            {d.madeBy && d.madeBy !== "Unknown" && (
                                                <p className="mt-1 text-[11px]" style={{ color: C.muted }}>by {d.madeBy}</p>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* action items — always shown so todos can be added by hand */}
                        <section className="space-y-2">
                            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
                                <ListChecks className="size-3.5" /> Action Items
                            </h4>
                            {memory?.actionItems?.length > 0 && (
                                <ul className="space-y-2">
                                    {memory.actionItems.map((a) => (
                                        <li
                                            key={a._id}
                                            className="flex items-start justify-between gap-2 rounded-lg border p-3 text-sm"
                                            style={{ background: C.deep, borderColor: C.border, color: C.text }}
                                        >
                                            <div className="flex-1">
                                                <p style={a.status === "done" ? { textDecoration: "line-through", color: C.muted } : undefined}>
                                                    {a.task}
                                                </p>
                                                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]" style={{ color: C.muted }}>
                                                    {a.assignedTo && a.assignedTo !== "Unassigned" && <span>→ {a.assignedTo}</span>}
                                                    {a.priority && a.priority !== "medium" && (
                                                        <span
                                                            className="rounded px-1.5 py-0.5 font-semibold uppercase"
                                                            style={a.priority === "high"
                                                                ? { background: "rgba(224,108,117,0.15)", color: "#e06c75" }
                                                                : { background: C.active, color: C.muted }}
                                                        >
                                                            {a.priority}
                                                        </span>
                                                    )}
                                                    {a.dueDate && <span>· due {a.dueDate}</span>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleActionItem(selectedConversation._id, a._id, NEXT_STATUS[a.status])}
                                                className="whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-bold uppercase transition-colors"
                                                style={STATUS_STYLES[a.status]}
                                                title="Click to change status"
                                            >
                                                {a.status.replace("_", " ")}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <form onSubmit={handleAdd} className="flex items-center gap-2 pt-1">
                                <input
                                    value={newTask}
                                    onChange={(e) => setNewTask(e.target.value)}
                                    placeholder="Add an action item…"
                                    className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
                                    style={{ background: C.deep, borderColor: C.border, color: C.text }}
                                />
                                <button
                                    type="submit"
                                    disabled={!newTask.trim()}
                                    className="flex size-9 shrink-0 items-center justify-center rounded-lg disabled:opacity-50"
                                    style={{ background: C.teal, color: C.onAccent }}
                                    title="Add action item"
                                >
                                    <Plus className="size-4" />
                                </button>
                            </form>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
};

export default ConversationMemoryPanel;
