import React, { useEffect } from 'react';
import UsersLoadingSkeleton from './UserLoadingSkeleton';
import NoChatsFound from './NoChatsFound';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';

const ChatsList = () => {
  const { getMyConversations, conversations, isConversationsLoading, setSelectedConversation } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();

  useEffect(() => {
    getMyConversations();
  }, [getMyConversations]);

  if (isConversationsLoading) return <UsersLoadingSkeleton />;
  if (!conversations || conversations.length === 0) return <NoChatsFound />;

  return (
    <>
      {conversations.map((conv) => {
        // For direct chats, find the other member to show their info
        const otherMember = conv.type === "direct" 
          ? conv.members.find(m => m._id !== authUser?._id)
          : null;
        
        const displayName = conv.type === "group" ? conv.name : (otherMember?.fullName || "Chat");
        const displayImage = conv.type === "group" ? (conv.groupImage || "/avatar.png") : (otherMember?.profilePic || "/avatar.png");
        const isOnline = conv.type === "direct" && otherMember && onlineUsers.includes(otherMember._id);

        return (
          <div
            key={conv._id}
            className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
            onClick={() => setSelectedConversation(conv)}
          >
            <div className="flex items-center gap-3">
              <div className={`avatar ${isOnline ? "online" : ""}`}>
                <div className="size-12 rounded-full">
                  <img src={displayImage} alt={displayName} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-slate-200 font-medium truncate">{displayName}</h4>
                {conv.lastMessage && (
                  <p className="text-slate-400 text-sm truncate">
                    {conv.lastMessage.senderId === authUser?._id ? "You: " : ""}
                    {conv.lastMessage.image ? "Shared an image" : conv.lastMessage.text}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default ChatsList;
