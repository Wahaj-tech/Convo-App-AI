import React, { useEffect, useState } from "react";
import {
  MessageSquare,
  Users,
  Bot,
  Settings,
  Plus,
  Search,
  Menu,
  LogOut,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { C } from "../lib/theme";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";
import CreateGroupModal from "../components/CreateGroupModal";
import ProfilePanel from "../components/ProfilePanel";
import toast from "react-hot-toast";

/*
  Full-screen Chat Hub (Figma "Desktop Chat Hub - Deep Dark"), wired to real data.
  3 panes on desktop: side nav · conversation list · active chat.
  On mobile it's a single pane that toggles: the list shows until a conversation
  is selected, then the chat shows (ChatHeader's back/X clears the selection).
*/

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ---- side navigation -------------------------------------------------------
function SideNavContent({ onClose, onNewChat, onOpenProfile }) {
  const { authUser, logout } = useAuthStore();
  const { activeTab, setActiveTab, isSoundEnabled, toggleSound, selectedConversation } = useChatStore();

  const go = (tab) => {
    setActiveTab(tab);
    onClose?.();
  };

  const openProfile = () => {
    onOpenProfile?.();
    onClose?.();
  };
  const openPersonas = () =>
    selectedConversation
      ? document.dispatchEvent(new CustomEvent("open-personas"))
      : toast("Open a conversation to manage its personas");

  const NAV = [
    { key: "chats", icon: MessageSquare, label: "Chats", onClick: () => go("chats") },
    { key: "contacts", icon: Users, label: "Contacts", onClick: () => go("contacts") },
    { key: "personas", icon: Bot, label: "Personas", onClick: openPersonas },
    { key: "profile", icon: Settings, label: "Profile", onClick: openProfile },
  ];

  return (
    <div className="flex h-full w-64 flex-col px-4 py-6" style={{ background: C.panel }}>
      {/* brand */}
      <div className="flex items-center gap-2.5 px-2 pb-8">
        <img src="/logo.svg" alt="" className="size-9 rounded-[10px]" />
        <div className="leading-tight">
          <p className="text-xl font-bold" style={{ color: C.teal }}>
            ConvoApp
          </p>
          <p className="text-[11px] font-semibold tracking-wider" style={{ color: C.muted }}>
            AI Collaboration
          </p>
        </div>
      </div>

      {/* new chat */}
      <button
        onClick={() => { onNewChat?.(); onClose?.(); }}
        className="mb-6 flex items-center justify-center gap-2 rounded py-2 text-sm font-medium"
        style={{ background: C.teal, color: C.onAccent }}
      >
        <Plus size={16} />
        New Chat
      </button>

      {/* nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ key, icon, label, onClick }) => {
          const on = key === activeTab;
          return (
            <button
              key={key}
              onClick={onClick}
              className="flex items-center gap-4 rounded px-4 py-2 text-sm font-medium transition-colors"
              style={{
                color: on ? C.teal : C.muted,
                background: on ? C.active : "transparent",
                borderRight: on ? `2px solid ${C.teal}` : "2px solid transparent",
              }}
            >
              {React.createElement(icon, { size: 20 })}
              {label}
            </button>
          );
        })}
      </nav>

      {/* footer: user + actions */}
      <div className="flex flex-col gap-3 border-t pt-5" style={{ borderColor: C.border }}>
        <div className="flex items-center gap-3 px-2">
          <button onClick={openProfile} className="size-10 shrink-0 overflow-hidden rounded-xl" title="Open profile">
            <img src={authUser?.profilePic || "/avatar.png"} alt={authUser?.fullName} className="size-full object-cover" />
          </button>
          <button onClick={openProfile} className="min-w-0 flex-1 text-left leading-tight">
            <p className="truncate text-sm font-medium" style={{ color: C.text }}>
              {authUser?.fullName}
            </p>
            <p className="text-xs" style={{ color: C.teal }}>
              Online
            </p>
          </button>
          <button onClick={toggleSound} style={{ color: C.muted }} title="Toggle sound">
            {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button onClick={logout} style={{ color: C.muted }} title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- a single conversation row --------------------------------------------
function ConversationRow({ conv, authUser, onlineUsers, selected, onClick }) {
  const isGroup = conv.type === "group";
  const other = isGroup ? null : conv.members?.find((m) => m._id !== authUser?._id);
  const name = isGroup ? conv.name : other?.fullName || "Deleted user";
  const image = isGroup ? conv.groupImage : other?.profilePic;
  const online = !isGroup && other && onlineUsers.includes(other._id);
  const preview = conv.lastMessage
    ? `${conv.lastMessage.senderId === authUser?._id ? "You: " : ""}${
        conv.lastMessage.image ? "📷 Photo" : conv.lastMessage.text || ""
      }`
    : "No messages yet";

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors"
      style={{
        background: selected ? C.active : "transparent",
        borderColor: selected ? C.border : "transparent",
      }}
    >
      <div className="relative shrink-0">
        {isGroup ? (
          image ? (
            <img src={image} alt={name} className="size-12 rounded-xl object-cover" />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-xl border" style={{ background: C.active, borderColor: C.border }}>
              <Users size={22} style={{ color: C.muted }} />
            </div>
          )
        ) : (
          <img src={image || "/avatar.png"} alt={name} className="size-12 rounded-xl border object-cover" style={{ borderColor: C.border }} />
        )}
        {online && (
          <span className="absolute bottom-0 right-0 size-3 rounded-full border-2" style={{ background: C.teal, borderColor: C.deep }} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium" style={{ color: C.text }}>
            {name}
          </span>
          <span className="shrink-0 text-[11px]" style={{ color: C.muted }}>
            {timeAgo(conv.lastMessageAt)}
          </span>
        </div>
        <p className="truncate text-sm" style={{ color: C.muted }}>
          {preview}
        </p>
      </div>
    </button>
  );
}

// ---- conversation / contact list (middle pane) ----------------------------
function ListPane({ onOpenNav, onNewChat }) {
  const {
    activeTab,
    conversations,
    getMyConversations,
    allContacts,
    getAllContacts,
    createConversation,
    setActiveTab,
    selectedConversation,
    setSelectedConversation,
    isConversationsLoading,
  } = useChatStore();
  const { authUser, onlineUsers } = useAuthStore();
  const [search, setSearch] = useState("");

  useEffect(() => {
    getMyConversations();
  }, [getMyConversations]);

  useEffect(() => {
    if (activeTab === "contacts") getAllContacts();
  }, [activeTab, getAllContacts]);

  const isContacts = activeTab === "contacts";

  const filteredConvs = conversations.filter((c) => {
    if (c.type === "direct") {
      const other = c.members?.find((m) => m._id !== authUser?._id);
      // Other participant was deleted from the DB → hide this orphaned chat.
      if (!other) return false;
      return other.fullName.toLowerCase().includes(search.toLowerCase());
    }
    return (c.name || "").toLowerCase().includes(search.toLowerCase());
  });
  const filteredContacts = allContacts.filter((c) =>
    c.fullName?.toLowerCase().includes(search.toLowerCase()),
  );

  const startDirect = async (contact) => {
    await createConversation({ type: "direct", members: [contact._id] });
    setActiveTab("chats");
  };

  return (
    <div className="flex h-full w-full flex-col border-r md:w-80" style={{ background: C.deep, borderColor: C.border }}>
      {/* search + mobile hamburger */}
      <div className="flex items-center gap-2 p-4">
        <button onClick={onOpenNav} className="rounded p-2 lg:hidden" style={{ color: C.muted, background: C.panelAlt }} aria-label="Menu">
          <Menu size={18} />
        </button>
        <div className="relative flex flex-1 items-center rounded border px-3 py-2.5" style={{ background: C.panelAlt, borderColor: C.border }}>
          <Search size={16} style={{ color: C.muted }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isContacts ? "Search contacts..." : "Search chats..."}
            className="ml-3 w-full bg-transparent text-sm outline-none"
            style={{ color: C.text }}
          />
        </div>
        <button
          onClick={onNewChat}
          className="flex size-10 shrink-0 items-center justify-center rounded"
          style={{ background: C.teal, color: C.onAccent }}
          title="New group chat"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <p className="px-1 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
          {isContacts ? "Contacts" : "Recent"}
        </p>

        {isConversationsLoading ? (
          <p className="px-1 py-4 text-sm" style={{ color: C.muted }}>
            Loading…
          </p>
        ) : isContacts ? (
          <div className="flex flex-col gap-1">
            {filteredContacts.map((contact) => (
              <button
                key={contact._id}
                onClick={() => startDirect(contact)}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-left"
              >
                {contact.profilePic ? (
                  <img src={contact.profilePic} alt={contact.fullName} className="size-12 rounded-xl object-cover" />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-xl border" style={{ background: C.active, borderColor: C.border }}>
                    <Users size={22} style={{ color: C.muted }} />
                  </div>
                )}
                <span className="truncate text-sm font-medium" style={{ color: C.text }}>
                  {contact.fullName}
                </span>
                {onlineUsers.includes(contact._id) && (
                  <span className="ml-auto size-2.5 rounded-full" style={{ background: C.teal }} />
                )}
              </button>
            ))}
            {!filteredContacts.length && (
              <p className="px-1 py-4 text-sm" style={{ color: C.muted }}>No contacts found.</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filteredConvs.map((conv) => (
              <ConversationRow
                key={conv._id}
                conv={conv}
                authUser={authUser}
                onlineUsers={onlineUsers}
                selected={selectedConversation?._id === conv._id}
                onClick={() => setSelectedConversation(conv)}
              />
            ))}
            {!filteredConvs.length && (
              <p className="px-1 py-4 text-sm" style={{ color: C.muted }}>
                No conversations yet. Tap a contact to start one.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- page shell ------------------------------------------------------------
export default function ChatPage() {
  const { selectedConversation, subscribeToMessages, unsubscribeFromMessages } = useChatStore();
  const socket = useAuthStore((s) => s.socket);
  const [navOpen, setNavOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Subscribe to realtime events at the top level so the sidebar AND the open
  // chat stay live — not just when a conversation is open. Re-runs if the socket
  // instance changes (reconnect).
  useEffect(() => {
    if (!socket) return;
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [socket, subscribeToMessages, unsubscribeFromMessages]);

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: C.deep }}>
      {/* desktop side nav */}
      <div className="hidden lg:flex">
        <SideNavContent onNewChat={() => setGroupModalOpen(true)} onOpenProfile={() => setProfileOpen(true)} />
      </div>

      {/* mobile side-nav drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <SideNavContent onClose={() => setNavOpen(false)} onNewChat={() => setGroupModalOpen(true)} onOpenProfile={() => setProfileOpen(true)} />
          <div className="flex-1 bg-black/50" onClick={() => setNavOpen(false)} />
        </div>
      )}

      {/* conversation list — hidden on mobile when a chat is open */}
      <div className={`${selectedConversation ? "hidden" : "flex"} w-full md:flex md:w-auto`}>
        <ListPane onOpenNav={() => setNavOpen(true)} onNewChat={() => setGroupModalOpen(true)} />
      </div>

      {/* active chat — hidden on mobile until a chat is selected */}
      <div className={`${selectedConversation ? "flex" : "hidden"} min-w-0 flex-1 flex-col md:flex`} style={{ background: C.deep }}>
        {selectedConversation ? <ChatContainer /> : <NoConversationPlaceholder />}
      </div>

      <CreateGroupModal isOpen={groupModalOpen} onClose={() => setGroupModalOpen(false)} />
      <ProfilePanel isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
