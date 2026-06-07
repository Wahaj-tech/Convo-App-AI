import React, { useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { XIcon, InfoIcon, ArrowLeft, BrainCircuit, Bot, Users } from 'lucide-react';
import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import GroupSettingsPanel from './GroupSettingsPanel';
import ConversationMemoryPanel from './ConversationMemoryPanel';
import PersonaSelector from './PersonaSelector';
import { C } from '../lib/theme';

const ChatHeader = () => {
    const { selectedConversation, setSelectedConversation } = useChatStore();
    const { onlineUsers, authUser } = useAuthStore();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isMemoryOpen, setIsMemoryOpen] = useState(false);
    const [isPersonasOpen, setIsPersonasOpen] = useState(false);

    useEffect(() => {
        const handleEscKey = (e) => {
            if (e.key === "Escape") setSelectedConversation(null);
        };
        window.addEventListener("keydown", handleEscKey);
        return () => window.removeEventListener("keydown", handleEscKey);
    }, [setSelectedConversation]);

    // Allow the sidebar "Personas" nav (in ChatPage) to open this panel.
    useEffect(() => {
        const open = () => setIsPersonasOpen(true);
        document.addEventListener("open-personas", open);
        return () => document.removeEventListener("open-personas", open);
    }, []);

    if (!selectedConversation) return null;

    const isGroup = selectedConversation.type === "group";
    const otherMember = isGroup ? null : selectedConversation.members.find(m => m._id !== authUser?._id);

    const displayName = isGroup ? selectedConversation.name : (otherMember?.fullName || "Deleted user");
    const displayImage = isGroup ? selectedConversation.groupImage : otherMember?.profilePic;
    const isOnline = !isGroup && otherMember && onlineUsers.includes(otherMember._id);

    return (
        <>
            <div
                className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6"
                style={{ background: C.panel, borderColor: C.border }}
            >
                <div className="flex min-w-0 items-center gap-3">
                    {/* mobile back */}
                    <button onClick={() => setSelectedConversation(null)} className="md:hidden" style={{ color: C.text }} aria-label="Back">
                        <ArrowLeft size={20} />
                    </button>

                    {/* avatar */}
                    <div className="relative shrink-0">
                        {isGroup ? (
                            displayImage ? (
                                <img src={displayImage} alt={displayName} className="size-10 rounded-xl object-cover" />
                            ) : (
                                <div className="flex size-10 items-center justify-center rounded-xl" style={{ background: C.active }}>
                                    <Users size={20} style={{ color: C.muted }} />
                                </div>
                            )
                        ) : (
                            <img src={displayImage || "/avatar.png"} alt={displayName} className="size-10 rounded-xl object-cover" />
                        )}
                        {isOnline && (
                            <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2" style={{ background: C.teal, borderColor: C.panel }} />
                        )}
                    </div>

                    <div className="min-w-0">
                        <h3 className="truncate font-medium" style={{ color: C.text }}>{displayName}</h3>
                        <p className="text-sm" style={{ color: C.muted }}>
                            {isGroup ? `${selectedConversation.members.length} members` : (isOnline ? "Online" : "Offline")}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    <button onClick={() => setIsPersonasOpen(true)} title="AI Personas" className="p-2" style={{ color: C.muted }}>
                        <Bot className="size-5" />
                    </button>
                    <button onClick={() => setIsMemoryOpen(true)} title="AI Memory" className="p-2" style={{ color: C.muted }}>
                        <BrainCircuit className="size-5" />
                    </button>
                    {isGroup && (
                        <button onClick={() => setIsSettingsOpen(true)} title="Group settings" className="p-2" style={{ color: C.muted }}>
                            <InfoIcon className="size-5" />
                        </button>
                    )}
                    <button onClick={() => setSelectedConversation(null)} title="Close" className="hidden p-2 md:block" style={{ color: C.muted }}>
                        <XIcon className="size-5" />
                    </button>
                </div>
            </div>

            <GroupSettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <ConversationMemoryPanel isOpen={isMemoryOpen} onClose={() => setIsMemoryOpen(false)} />
            <PersonaSelector isOpen={isPersonasOpen} onClose={() => setIsPersonasOpen(false)} />
        </>
    );
};

export default ChatHeader;
