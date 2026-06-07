import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import ChatHeader from './ChatHeader';
import NoChatHistoryPlaceholder from './NoChatHistoryPlaceholder';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import MessageInput from './MessageInput';
import MessagesLoadingSkeleton from './MessageLoadingSkeleton';
import AiTypingIndicator from './AiTypingIndicator';
import PanelVerdictCard from './PanelVerdictCard';
import { C } from '../lib/theme';

const ChatContainer = () => {
  const {
    selectedConversation, getMessages, messages, isMessagesLoading, aiTyping,
    loadOlderMessages, hasMoreMessages, isLoadingOlder,
  } = useChatStore();
  const { authUser } = useAuthStore();

  const isAiTyping = aiTyping[selectedConversation?._id];

  // Load this conversation's messages and join its room. Realtime listeners are
  // set up globally in ChatPage, so they are NOT (re)registered here.
  useEffect(() => {
    if (selectedConversation) {
      getMessages(selectedConversation._id);
    }
  }, [selectedConversation, getMessages]);

  const scrollRef = useRef(null);
  const messageEndRef = useRef(null);
  // When we PREPEND an older page, we must keep the viewport anchored to the same
  // message instead of jumping. These refs capture the pre-prepend scroll metrics.
  const restoreRef = useRef(false);
  const prevHeightRef = useRef(0);
  const prevTopRef = useRef(0);

  // After messages change: restore scroll on a prepend, else scroll to bottom.
  useLayoutEffect(() => {
    if (restoreRef.current && scrollRef.current) {
      const el = scrollRef.current;
      el.scrollTop = el.scrollHeight - prevHeightRef.current + prevTopRef.current;
    }
  }, [messages]);

  useEffect(() => {
    if (restoreRef.current) {
      restoreRef.current = false; // this update was an older-page prepend — don't yank to bottom
      return;
    }
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Near the top + more to load → fetch the previous page.
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop <= 80 && hasMoreMessages && !isLoadingOlder) {
      prevHeightRef.current = el.scrollHeight;
      prevTopRef.current = el.scrollTop;
      restoreRef.current = true;
      loadOlderMessages(selectedConversation._id);
    }
  };

  const getDisplayName = () => {
    if (!selectedConversation) return "";
    if (selectedConversation.type === "group") return selectedConversation.name;
    const otherMember = selectedConversation.members.find(m => m._id !== authUser?._id);
    return otherMember?.fullName || "Chat";
  };

  return (
    <div className="flex h-full flex-col" style={{ background: C.deep }}>
      <ChatHeader />
      <div ref={scrollRef} onScroll={handleScroll} className='flex-1 overflow-y-auto px-4 py-6 md:px-10'>
        {messages.length > 0 && !isMessagesLoading ? (
          <div className='mx-auto flex w-full max-w-5xl flex-col gap-6'>
            {/* older-page loader / start-of-conversation marker */}
            {isLoadingOlder && (
              <div className="flex items-center justify-center gap-2 py-1 text-xs" style={{ color: C.muted }}>
                <Loader2 className="size-4 animate-spin" /> Loading earlier messages…
              </div>
            )}
            {!hasMoreMessages && messages.length > 10 && (
              <p className="text-center text-xs" style={{ color: C.muted }}>Beginning of the conversation</p>
            )}

            {messages.map((msg) => {
              // AI Roundtable verdict → render the Decision Card instead of a bubble.
              if (msg.messageType === "verdict") {
                return <PanelVerdictCard key={msg._id} meta={msg.meta} />;
              }

              const isMyMessage = msg.senderId?._id === authUser?._id || msg.senderId === authUser?._id;
              const isAiMessage = msg.senderType === "ai";
              const persona = isAiMessage ? msg.personaId : null;
              const personaColor = persona?.color || C.teal;
              const senderName = isAiMessage
                ? (persona?.name || "Convo AI")
                : (msg.senderId?.fullName || "Unknown");
              const showName = !isMyMessage && (selectedConversation.type === "group" || isAiMessage);

              return (
                <div key={msg._id} className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"}`}>
                  {showName && (
                    <span className="mb-1 flex items-center gap-2 px-1">
                      <span className="text-xs font-medium" style={{ color: isAiMessage ? personaColor : C.muted }}>
                        {senderName}
                      </span>
                      {/* Roundtable stance chip (Round 1 takes carry a stance + confidence) */}
                      {isAiMessage && msg.meta?.stance && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                          style={{ background: `${personaColor}1f`, color: personaColor }}
                        >
                          {msg.meta.stance} · {msg.meta.confidence}%
                        </span>
                      )}
                    </span>
                  )}
                  <div
                    className="max-w-[85%] rounded-lg border px-4 py-3 md:max-w-[70%]"
                    style={
                      isMyMessage
                        ? { background: C.userBubble, borderColor: "transparent", color: C.text }
                        : isAiMessage
                        ? { background: C.panelAlt, borderColor: personaColor, borderLeftWidth: 2, color: C.text }
                        : { background: C.panelAlt, borderColor: C.border, color: C.text }
                    }
                  >
                    {msg.image && (
                      <img src={msg.image} alt="Shared" className='mb-2 h-48 rounded-lg object-cover' />
                    )}
                    {msg.text && (
                      <p className='whitespace-pre-wrap text-[15px] leading-relaxed'>{msg.text}</p>
                    )}
                    <p className="mt-1 text-[11px]" style={{ color: C.muted }}>
                      {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}

            {isAiTyping && <AiTypingIndicator persona={typeof isAiTyping === "object" ? isAiTyping : null} />}

            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (
          <NoChatHistoryPlaceholder name={getDisplayName()} />
        )}
      </div>
      <MessageInput />
    </div>
  )
}

export default ChatContainer;
