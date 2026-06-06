import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

// Phase 4: client-side store for AI personas (defaults + the user's custom ones).
export const usePersonaStore = create((set, get) => ({
    personas: [],
    isPersonasLoading: false,

    getPersonas: async () => {
        set({ isPersonasLoading: true });
        try {
            const res = await axiosInstance.get("/personas");
            set({ personas: res.data });
        } catch (error) {
            toast.error(error.response?.data.message || "Failed to load personas");
        } finally {
            set({ isPersonasLoading: false });
        }
    },

    createPersona: async (data) => {
        try {
            const res = await axiosInstance.post("/personas", data);
            set({ personas: [...get().personas, res.data] });
            toast.success("Persona created");
            return res.data;
        } catch (error) {
            toast.error(error.response?.data.message || "Failed to create persona");
        }
    },

    updatePersona: async (id, data) => {
        try {
            const res = await axiosInstance.put(`/personas/${id}`, data);
            set({ personas: get().personas.map((p) => (p._id === id ? res.data : p)) });
            toast.success("Persona updated");
            return res.data;
        } catch (error) {
            toast.error(error.response?.data.message || "Failed to update persona");
        }
    },

    deletePersona: async (id) => {
        try {
            await axiosInstance.delete(`/personas/${id}`);
            set({ personas: get().personas.filter((p) => p._id !== id) });
            toast.success("Persona deleted");
        } catch (error) {
            toast.error(error.response?.data.message || "Failed to delete persona");
        }
    },

    // The @mention handle the backend matches on: name without spaces/punctuation.
    handleOf: (name) => (name || "").toLowerCase().replace(/[^a-z0-9]/g, ""),
}));
