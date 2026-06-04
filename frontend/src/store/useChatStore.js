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
    aiTyping: {}, // { conversationId: boolean }
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
            set({ messages: res.data.messages });

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

    subscribeToMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.on("newMessage", (newMessage) => {
            const { isSoundEnabled, conversations, selectedConversation } = get();

            // Update the last message preview in the sidebar regardless of which chat is open
            set({
                conversations: conversations.map(c => 
                    c._id === newMessage.conversationId 
                        ? { ...c, lastMessage: newMessage, lastMessageAt: newMessage.createdAt }
                        : c
                )
            });

            // If the message is for the currently open conversation, add it to the messages list
            if (selectedConversation && newMessage.conversationId === selectedConversation._id) {
                set({ messages: [...get().messages, newMessage] });
            }

            if (isSoundEnabled) {
                const notificationAudio = new Audio("/sounds/notification.mp3");
                notificationAudio.currentTime = 0;
                notificationAudio.play().catch((err) => { console.error("Error playing notification sound:", err) });
            }
        });

        socket.on("aiTyping", ({ conversationId, isTyping }) => {
            set({
                aiTyping: { ...get().aiTyping, [conversationId]: isTyping }
            });
        });

        socket.on("aiError", ({ conversationId, error }) => {
            toast.error(error);
        });

        socket.on("conversationUpdated", (updatedConversation) => {
            const { conversations, selectedConversation } = get();
            set({
                conversations: conversations.map(c => 
                    c._id === updatedConversation._id ? updatedConversation : c
                )
            });
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
            socket.off("newMessage");
            socket.off("aiTyping");
            socket.off("aiError");
            socket.off("conversationUpdated");
            socket.off("removedFromConversation");
        }
    },
}))
