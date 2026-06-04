import React, { useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { XIcon, InfoIcon } from 'lucide-react';
import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import GroupSettingsPanel from './GroupSettingsPanel';

const ChatHeader = () => {
    const { selectedConversation, setSelectedConversation } = useChatStore();
    const { onlineUsers, authUser } = useAuthStore();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        const handleEscKey = (e) => {
            if (e.key === "Escape") {
                setSelectedConversation(null);
            }
        };

        window.addEventListener("keydown", handleEscKey);
        return () => {
            window.removeEventListener("keydown", handleEscKey);
        };
    }, [setSelectedConversation]);

    if (!selectedConversation) return null;

    const isGroup = selectedConversation.type === "group";
    const otherMember = isGroup ? null : selectedConversation.members.find(m => m._id !== authUser?._id);
    
    const displayName = isGroup ? selectedConversation.name : (otherMember?.fullName || "Chat");
    const displayImage = isGroup ? (selectedConversation.groupImage || "/avatar.png") : (otherMember?.profilePic || "/avatar.png");
    const isOnline = !isGroup && otherMember && onlineUsers.includes(otherMember._id);

    return (
        <>
            <div className='flex justify-between items-center bg-slate-800/50 border-b border-slate-700/50 max-h-[84px] px-6 py-4 flex-1 '>
                <div className='flex items-center space-x-3'>
                    <div className={`avatar ${isOnline ? "online" : ""}`}>
                        <div className='w-12 rounded-full'>
                            <img src={displayImage} alt={displayName} />
                        </div>
                    </div>
                    <div>
                        <h3 className='text-slate-200 font-medium'>{displayName}</h3>
                        <p className='text-slate-400 text-sm'>
                            {isGroup 
                                ? `${selectedConversation.members.length} members` 
                                : (isOnline ? "Online" : "Offline")
                            }
                        </p>
                    </div>
                </div>
                <div className='flex items-center space-x-4'>
                    {isGroup && (
                        <button onClick={() => setIsSettingsOpen(true)}>
                            <InfoIcon className='w-5 h-5 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer' />
                        </button>
                    )}
                    <button onClick={() => setSelectedConversation(null)}>
                        <XIcon className='w-5 h-5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer' />
                    </button>
                </div>
            </div>

            <GroupSettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </>
    );
};

export default ChatHeader;
