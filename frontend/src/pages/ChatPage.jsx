import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { useChatStore } from "../store/useChatStore";
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";
import CreateGroupModal from "../components/CreateGroupModal";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

function ChatPage() {
  const { activeTab, selectedConversation } = useChatStore();
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  return (
    <div className="relative w-full max-w-6xl h-[800px] ">
      <BorderAnimatedContainer>
        {/*LEFT SIDE */}
        <div className="w-80 bg-slate-700/50 backdrop-blur-sm flex flex-col border-r border-slate-700/50">
          <ProfileHeader />
          <div className="px-4 py-2 flex items-center justify-between">
            <ActiveTabSwitch />
            <button 
              onClick={() => setIsGroupModalOpen(true)}
              className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
              title="Create Group"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {activeTab === "chats" ? <ChatsList /> : <ContactList />}
          </div>
        </div>

        {/*RIGHT SIDE */}
        <div className="flex-1 flex flex-col bg-slate-900/50 backdrop-blur-sm">
          {selectedConversation ? <ChatContainer /> : <NoConversationPlaceholder />}
        </div>
      </BorderAnimatedContainer>

      <CreateGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
    </div>
  )
}

export default ChatPage;
