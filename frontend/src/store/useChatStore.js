import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { toast } from 'react-hot-toast';
import { useAuthStore } from './useAuthStore.js';

export const useChatStore = create((set, get) => ({
    allContacts: [],
    conversations: [],
    messages: [],
    activeTab: "chats",
    selectedConversation: null,
    isConversationsLoading: false,
    isMessagesLoading: false,
    hasMoreMessages: false, // are there older messages to page in? (from server's hasMore)
    isLoadingOlder: false, // currently fetching an older page (scroll-up)
    aiTyping: {}, // { conversationId: boolean }
    memory: null, // Phase 3: the distilled memory of the selected conversation
    isMemoryLoading: false,
    isSoundEnabled: localStorage.getItem("isSoundEnabled") === "true" ? true : false,

    toggleSound: () => {
        const newValue = !get().isSoundEnabled;
        localStorage.setItem("isSoundEnabled", newValue);
        set({ isSoundEnabled: newValue });
    },

    setActiveTab: (tab) => {
        set({ activeTab: tab });
    },

    setSelectedConversation: (conversation) => {
        set({ selectedConversation: conversation });
    },

    getAllContacts: async () => {
        set({ isConversationsLoading: true });
        try {
            const res = await axiosInstance.get("/messages/contacts");
            set({ allContacts: res.data.filterUsers });
        } catch (error) {
            toast.error(error.response?.data.message || "Failed to load contacts");
        } finally {
            set({ isConversationsLoading: false });
        }
    },

    getMyConversations: async () => {
        set({ isConversationsLoading: true });
        try {
            const res = await axiosInstance.get("/conversations");
            set({ conversations: res.data });

            // Join all conversation rooms via socket
            const socket = useAuthStore.getState().socket;
            if (socket && res.data.length > 0) {
                const conversationIds = res.data.map(c => c._id);
                socket.emit("joinConversations", conversationIds);
            }
        } catch (error) {
            toast.error(error.response?.data.message || "Failed to load conversations");
        } finally {
            set({ isConversationsLoading: false });
        }
    },

    getMessages: async (conversationId) => {
        set({ isMessagesLoading: true });
        try {
            const res = await axiosInstance.get(`/messages/${conversationId}`);
            // Server returns the NEWEST page (oldest→newest) plus hasMore.
            set({ messages: res.data.messages, hasMoreMessages: !!res.data.hasMore });

            // Ensure we are joined to this conversation's socket room
            const socket = useAuthStore.getState().socket;
            if (socket) {
                socket.emit("joinConversation", conversationId);
            }
        } catch (error) {
            toast.error(error.response?.data.message || "Failed to load messages");
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    // Page in OLDER messages when the user scrolls to the top of the chat.
    // Uses the oldest loaded message's _id as the cursor (?before=...), so cost
    // stays constant no matter how long the conversation is.
    loadOlderMessages: async (conversationId) => {
        const { messages, hasMoreMessages, isLoadingOlder } = get();
        if (!hasMoreMessages || isLoadingOlder || messages.length === 0) return;

        const oldestId = messages[0]?._id;
        if (!oldestId) return;

        set({ isLoadingOlder: true });
        try {
            const res = await axiosInstance.get(
                `/messages/${conversationId}?before=${oldestId}&limit=50`
            );
            // Prepend the older page in front of what we already have.
            set({
                messages: [...res.data.messages, ...get().messages],
                hasMoreMessages: !!res.data.hasMore,
            });
        } catch (error) {
            toast.error(error.response?.data.message || "Failed to load older messages");
        } finally {
            set({ isLoadingOlder: false });
        }
    },

    createConversation: async (data) => {
        try {
            const res = await axiosInstance.post("/conversations", data);
            const newConversation = res.data;

            // Update conversations list if it's not already there
            const { conversations } = get();
            if (!conversations.find(c => c._id === newConversation._id)) {
                set({ conversations: [newConversation, ...conversations] });
            }

            // Select it
            set({ selectedConversation: newConversation });

            // Join the socket room
            const socket = useAuthStore.getState().socket;
            if (socket) {
                socket.emit("joinConversation", newConversation._id);
            }

            return newConversation;
        } catch (error) {
            toast.error(error.response?.data.message || "Failed to create conversation");
        }
    },

    updateGroup: async (id, data) => {
        try {
            const res = await axiosInstance.put(`/conversations/${id}`, data);
            const updatedConversation = res.data;
            
            set({
                conversations: get().conversations.map(c => c._id === id ? updatedConversation : c),
                selectedConversation: updatedConversation
            });
            toast.success("Group updated successfully");
        } catch (error) {
            toast.error(error.response?.data.message || "Failed to update group");
        }
    },

    addGroupMembers: async (id, memberIds) => {
        try {
            const res = await axiosInstance.post(`/conversations/${id}/members`, { members: memberIds });
            const updatedConversation = res.data;
            
            set({
                conversations: get().conversations.map(c => c._id === id ? updatedConversation : c),
                selectedConversation: updatedConversation
            });
            toast.success("Members added successfully");
        } catch (error) {
            toast.error(error.response?.data.message || "Failed to add members");
        }
    },

    removeGroupMember: async (id, memberIds) => {
        try {
            const res = await axiosInstance.delete(`/conversations/${id}/members`, { data: { members: memberIds } });
            const updatedConversation = res.data;
            
            set({
                conversations: get().conversations.map(c => c._id === id ? updatedConversation : c),
                selectedConversation: updatedConversation
            });
            toast.success("Member removed successfully");
        } catch (error) {
            toast.error(error.response?.data.message || "Failed to remove member");
        }
    },

    leaveGroup: async (id) => {
        try {
            await axiosInstance.delete(`/conversations/${id}`);
            set({
                conversations: get().conversations.filter(c => c._id !== id),
                selectedConversation: null
            });
            toast.success("Left group successfully");
        } catch (error) {
            toast.error(error.response?.data.message || "Failed to leave group");
        }
    },

    // --- Phase 4: set which personas are enabled for a conversation ---
    setConversationPersonas: async (conversationId, personaIds) => {
        try {
            const res = await axiosInstance.put(`/conversations/${conversationId}/personas`, { personas: personaIds });
            const updated = res.data;
            set({
                conversations: get().conversations.map(c => c._id === conversationId ? updated : c),
                selectedConversation: get().selectedConversation?._id === conversationId ? updated : get().selectedConversation,
            });
        } catch (error) {
            toast.error(error.response?.data.message || "Failed to update personas");
        }
    },

    // --- Phase 3: Conversation Memory ---
    getMemory: async (conversationId) => {
        set({ isMemoryLoading: true, memory: null });
        try {
            const res = await axiosInstance.get(`/conversations/${conversationId}/memory`);
            set({ memory: res.data });
        } catch (error) {
            toast.error(error.response?.data.message || "Failed to load memory");
        } finally {
            set({ isMemoryLoading: false });
        }
    },

    toggleActionItem: async (conversationId, itemId, status) => {
        try {
            const res = await axiosInstance.patch(
                `/conversations/${conversationId}/memory/action-items/${itemId}`,
                { status }
            );
            // Server broadcasts "memoryUpdated" too, but update locally for instant feedback
            set({ memory: res.data });
        } catch (error) {
            toast.error(error.response?.data.message || "Failed to update action item");
        }
    },

    sendMessage: async (data) => {
        const { selectedConversation, messages } = get();
        if (!selectedConversation) return;

        const { authUser } = useAuthStore.getState();
        const tempId = `temp-${Date.now()}`;
        
        const optimisticMessage = {
            _id: tempId,
            senderId: authUser,
            conversationId: selectedConversation._id,
            text: data.text,
            image: data.image,
            createdAt: new Date().toISOString(),
            isOptimistic: true,
        };

        // Immediately update UI
        set({ messages: [...messages, optimisticMessage] });

        try {
            const res = await axiosInstance.post(`/messages/send/${selectedConversation._id}`, data);
            // Replace optimistic message with real one
            const updatedMessages = get().messages.map(m => 
                m._id === tempId ? res.data : m
            );
            set({ messages: updatedMessages });
            
            // Update last message in the conversation list for sidebar
            const { conversations } = get();
            set({
                conversations: conversations.map(c => 
                    c._id === selectedConversation._id 
                        ? { ...c, lastMessage: res.data, lastMessageAt: res.data.createdAt }
                        : c
                )
            });
        } catch (error) {
            // Rollback on error
            set({ messages: messages });
            toast.error(error.response?.data.message || "Failed to send message");
        }
    },

    // Re-join every conversation's socket room (called on (re)connect — Render's
    // free tier drops idle sockets, and without re-joining, realtime silently dies).
    rejoinRooms: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        const { conversations, selectedConversation } = get();
        const ids = conversations.map((c) => c._id);
        if (ids.length) socket.emit("joinConversations", ids);
        if (selectedConversation) socket.emit("joinConversation", selectedConversation._id);
    },

    subscribeToMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        // Remove any existing listeners first so this is safe to call more than once
        // (prevents duplicate handlers → duplicate messages).
        get().unsubscribeFromMessages();

        // On (re)connect, re-join all rooms so realtime keeps working after a drop.
        socket.on("connect", () => {
            get().rejoinRooms();
            // Refresh the sidebar in case we missed updates while disconnected.
            get().getMyConversations();
        });

        socket.on("newMessage", (newMessage) => {
            const { isSoundEnabled, conversations, selectedConversation, messages } = get();

            // Update the last message preview in the sidebar regardless of which chat is open
            set({
                conversations: conversations.map(c =>
                    c._id === newMessage.conversationId
                        ? { ...c, lastMessage: newMessage, lastMessageAt: newMessage.createdAt }
                        : c
                )
            });

            // If the message is for the open conversation, append it — but de-dup by _id
            // so a message we already have (optimistic copy, or a stray echo of our own
            // send) is never shown twice.
            if (
                selectedConversation &&
                newMessage.conversationId === selectedConversation._id &&
                !messages.some((m) => m._id === newMessage._id)
            ) {
                set({ messages: [...messages, newMessage] });
            }

            if (isSoundEnabled) {
                const notificationAudio = new Audio("/sounds/notification.mp3");
                notificationAudio.currentTime = 0;
                notificationAudio.play().catch((err) => { console.error("Error playing notification sound:", err) });
            }
        });

        socket.on("aiTyping", ({ conversationId, isTyping, persona }) => {
            // Store the persona that's typing (so the indicator shows its name/color),
            // or false when it stops. `persona || true` keeps it truthy for legacy events.
            set({
                aiTyping: { ...get().aiTyping, [conversationId]: isTyping ? (persona || true) : false }
            });
        });

        socket.on("aiError", ({ error }) => {
            toast.error(error);
        });

        socket.on("memoryUpdated", (updatedMemory) => {
            const { selectedConversation } = get();
            // Only refresh the panel if it's for the conversation we're viewing
            if (selectedConversation?._id === updatedMemory.conversationId) {
                set({ memory: updatedMemory });
            }
        });

        socket.on("conversationUpdated", (updatedConversation) => {
            const { conversations, selectedConversation } = get();
            const exists = conversations.some(c => c._id === updatedConversation._id);
            set({
                // Upsert: update if we already have it, otherwise add it to the top
                // (this is how a NEW group you were just added to appears in real time).
                conversations: exists
                    ? conversations.map(c => c._id === updatedConversation._id ? updatedConversation : c)
                    : [updatedConversation, ...conversations]
            });
            // Make sure we're in the new room so future messages arrive live.
            const socket = useAuthStore.getState().socket;
            if (!exists && socket) socket.emit("joinConversation", updatedConversation._id);
            if (selectedConversation?._id === updatedConversation._id) {
                set({ selectedConversation: updatedConversation });
            }
        });

        socket.on("removedFromConversation", ({ conversationId }) => {
            const { conversations, selectedConversation } = get();
            set({
                conversations: conversations.filter(c => c._id !== conversationId)
            });
            if (selectedConversation?._id === conversationId) {
                set({ selectedConversation: null });
                toast.error("You have been removed from the conversation");
            }
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (socket) {
            socket.off("connect");
            socket.off("newMessage");
            socket.off("aiTyping");
            socket.off("aiError");
            socket.off("memoryUpdated");
            socket.off("conversationUpdated");
            socket.off("removedFromConversation");
        }
    },
}))
