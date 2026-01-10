import { create } from 'zustand';
import apiClient from '@/lib/api';

interface Video {
    _id: string;
    title: string;
    thumbnail: string;
    duration: number;
    owner: {
        username: string;
    }
}

interface QueueStore {
    queue: Video[];
    isLoading: boolean;
    fetchQueue: () => Promise<void>;
    addToQueue: (videoId: string) => Promise<void>;
    removeFromQueue: (videoId: string) => Promise<void>;
    clearQueue: () => Promise<void>;
}

export const useQueueStore = create<QueueStore>((set) => ({
    queue: [],
    isLoading: false,

    fetchQueue: async () => {
        set({ isLoading: true });
        try {
            const response = await apiClient.get('/queue');
            // Ensure we handle the response structure correctly
            const videos = response.data.data?.videos || [];
            set({ queue: videos });
        } catch (error) {
            console.error("Failed to fetch queue", error);
        } finally {
            set({ isLoading: false });
        }
    },

    addToQueue: async (videoId: string) => {
        try {
            const response = await apiClient.post(`/queue/add/${videoId}`);
            // Optimistic can be tricky with full object requirement, so we rely on response or re-fetch
            const updatedQueue = response.data.data.videos;
             set({ queue: updatedQueue });
        } catch (error) {
            console.error("Failed to add to queue", error);
        }
    },

    removeFromQueue: async (videoId: string) => {
        try {
            set((state) => ({ queue: state.queue.filter(v => v._id !== videoId) }));
            await apiClient.patch(`/queue/remove/${videoId}`);
        } catch (error) {
            console.error("Failed to remove from queue", error);
        }
    },

    clearQueue: async () => {
        try {
            set({ queue: [] });
            await apiClient.delete('/queue');
        } catch (error) {
            console.error("Failed to clear queue", error);
        }
    }
}));