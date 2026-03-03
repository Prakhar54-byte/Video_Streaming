import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WatchLaterStore {
  videoIds: string[];
  addToWatchLater: (videoId: string) => void;
  removeFromWatchLater: (videoId: string) => void;
  isInWatchLater: (videoId: string) => boolean;
  clearWatchLater: () => void;
}

export const useWatchLaterStore = create<WatchLaterStore>()(
  persist(
    (set, get) => ({
      videoIds: [],

      addToWatchLater: (videoId: string) => {
        const current = get().videoIds;
        if (!current.includes(videoId)) {
          set({ videoIds: [...current, videoId] });
        }
      },

      removeFromWatchLater: (videoId: string) => {
        set({ videoIds: get().videoIds.filter((id) => id !== videoId) });
      },

      isInWatchLater: (videoId: string) => {
        return get().videoIds.includes(videoId);
      },

      clearWatchLater: () => {
        set({ videoIds: [] });
      },
    }),
    {
      name: 'watch-later-storage',
    }
  )
);
