import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface HiddenVideosStore {
  videoIds: string[];
  hideVideo: (videoId: string) => void;
  unhideVideo: (videoId: string) => void;
  isHidden: (videoId: string) => boolean;
  clearHiddenVideos: () => void;
}

export const useHiddenVideosStore = create<HiddenVideosStore>()(
  persist(
    (set, get) => ({
      videoIds: [],

      hideVideo: (videoId: string) => {
        const current = get().videoIds;
        if (!current.includes(videoId)) {
          set({ videoIds: [...current, videoId] });
        }
      },

      unhideVideo: (videoId: string) => {
        set({ videoIds: get().videoIds.filter((id) => id !== videoId) });
      },

      isHidden: (videoId: string) => {
        return get().videoIds.includes(videoId);
      },

      clearHiddenVideos: () => {
        set({ videoIds: [] });
      },
    }),
    {
      name: 'hidden-videos-storage',
    }
  )
);
