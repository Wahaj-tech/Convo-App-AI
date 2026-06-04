import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import ChatHeader from './ChatHeader';
import NoChatHistoryPlaceholder from './NoChatHistoryPlaceholder';
import { useEffect, useRef } from 'react';
import MessageInput from './MessageInput';
import MessagesLoadingSkeleton from './MessageLoadingSkeleton';
import AiTypingIndicator from './AiTypingIndicator';

const ChatContainer = () => {
  const { selectedConversation, getMessages, messages, isMessagesLoading, unsubscribeFromMessages, subscribeToMessages, aiTyping } = useChatStore();
  const { authUser } = useAuthStore();

  const isAiTyping = aiTyping[selectedConversation?._id];

  useEffect(() => {
    if (selectedConversation) {
      getMessages(selectedConversation._id);
      subscribeToMessages();
    }
    //cleanup function to unsubscribe from messages when we switch to another chat or when component unmounts
    return () => {
      unsubscribeFromMessages();
    }
  }, [selectedConversation, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  const messageEndRef = useRef(null);
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages]);

  const getDisplayName = () => {
    if (!selectedConversation) return "";
    if (selectedConversation.type === "group") return selectedConversation.name;
    const otherMember = selectedConversation.members.find(m => m._id !== authUser?._id);
    return otherMember?.fullName || "Chat";
  };

  return (
    <>
      <ChatHeader />
      <div className='flex-1 px-6 overflow-y-auto py-8 '>
        {messages.length > 0 && !isMessagesLoading ? (
          <div className='max-w-3xl mx-auto space-y-6'>
            {messages.map((msg) => {
              const isMyMessage = msg.senderId?._id === authUser?._id || msg.senderId === authUser?._id;
              const isAiMessage = msg.senderType === "ai";
              const senderName = msg.senderId?.fullName || (isAiMessage ? "Convo AI" : "Unknown");
              
              return (
                <div key={msg._id} className={`chat ${isMyMessage ? "chat-end" : "chat-start"}`}>
                  <div className="chat-header mb-1 opacity-50 text-xs">
                    {(!isMyMessage && (selectedConversation.type === "group" || isAiMessage)) && (
                      <span className="mr-2">{senderName}</span>
                    )}
                  </div>
                  <div className={`chat-bubble relative ${
                    isMyMessage 
                    ? "bg-cyan-600 text-white" 
                    : isAiMessage
                    ? "bg-gradient-to-br from-violet-600 to-purple-700 text-white"
                    : "bg-slate-800 text-slate-200"
                  }`}>
                    {msg.image && (
                      <img src={msg.image} alt="Shared" className='rounded-lg h-48 object-cover ' />
                    )}
                    {msg.text && (
                      <p className='mt-2 whitespace-pre-wrap'>{msg.text}</p>
                    )}
                    <p className="text-xs mt-1 opacity-75 flex items-center gap-1">
                      {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {isAiTyping && <AiTypingIndicator />}

            {/*to scroll to the latest message--->*/}
            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (
          <NoChatHistoryPlaceholder name={getDisplayName()} />
        )}
      </div>
      <MessageInput />
    </>
  )
}

export default ChatContainer;
