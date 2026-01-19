import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PlaylistVideo {
  _id: string;
  title: string;
  thumbnail: string;
  duration: number;
  views?: number;
  category?: string;
  owner?: {
    _id: string;
    username: string;
    fullName?: string;
    avatar?: string;
  };
}

interface PlaylistQueueState {
  // Current playlist being played
  playlistId: string | null;
  playlistName: string | null;
  
  // Queue of videos
  queue: PlaylistVideo[];
  originalQueue: PlaylistVideo[]; // Keep original order for unshuffle
  
  // Current position in queue
  currentIndex: number;
  
  // Shuffle state
  isShuffled: boolean;
  
  // Manual queue mode (not tied to a playlist)
  isManualQueue: boolean;
  
  // Actions
  setPlaylistQueue: (playlistId: string, playlistName: string, videos: PlaylistVideo[], startIndex?: number, shuffle?: boolean) => void;
  clearQueue: () => void;
  setCurrentIndex: (index: number) => void;
  nextVideo: () => PlaylistVideo | null;
  previousVideo: () => PlaylistVideo | null;
  toggleShuffle: () => void;
  getCurrentVideo: () => PlaylistVideo | null;
  hasNext: () => boolean;
  hasPrevious: () => boolean;
  addToQueue: (video: PlaylistVideo) => void;
  removeFromQueue: (videoId: string) => void;
  isInQueue: (videoId: string) => boolean;
}

export const usePlaylistQueueStore = create<PlaylistQueueState>()(
  persist(
    (set, get) => ({
      playlistId: null,
      playlistName: null,
      queue: [],
      originalQueue: [],
      currentIndex: 0,
      isShuffled: false,
      isManualQueue: false,

      setPlaylistQueue: (playlistId, playlistName, videos, startIndex = 0, shuffle = false) => {
        let queue = [...videos];
        
        if (shuffle) {
          // Shuffle but keep the start video first
          const startVideo = videos[startIndex];
          const otherVideos = videos.filter((_, i) => i !== startIndex);
          const shuffled = otherVideos.sort(() => Math.random() - 0.5);
          queue = [startVideo, ...shuffled];
          startIndex = 0;
        }
        
        set({
          playlistId,
          playlistName,
          queue,
          originalQueue: videos,
          currentIndex: startIndex,
          isShuffled: shuffle,
          isManualQueue: false,
        });
      },

      clearQueue: () => {
        set({
          playlistId: null,
          playlistName: null,
          queue: [],
          originalQueue: [],
          currentIndex: 0,
          isShuffled: false,
          isManualQueue: false,
        });
      },

      setCurrentIndex: (index) => {
        const { queue } = get();
        if (index >= 0 && index < queue.length) {
          set({ currentIndex: index });
        }
      },

      nextVideo: () => {
        const { queue, currentIndex } = get();
        if (currentIndex < queue.length - 1) {
          const newIndex = currentIndex + 1;
          set({ currentIndex: newIndex });
          return queue[newIndex];
        }
        return null;
      },

      previousVideo: () => {
        const { queue, currentIndex } = get();
        if (currentIndex > 0) {
          const newIndex = currentIndex - 1;
          set({ currentIndex: newIndex });
          return queue[newIndex];
        }
        return null;
      },

      toggleShuffle: () => {
        const { isShuffled, originalQueue, queue, currentIndex } = get();
        const currentVideo = queue[currentIndex];
        
        if (isShuffled) {
          // Unshuffle - restore original order
          const newIndex = originalQueue.findIndex(v => v._id === currentVideo?._id);
          set({
            queue: originalQueue,
            currentIndex: newIndex >= 0 ? newIndex : 0,
            isShuffled: false,
          });
        } else {
          // Shuffle - keep current video first
          const otherVideos = originalQueue.filter(v => v._id !== currentVideo?._id);
          const shuffled = otherVideos.sort(() => Math.random() - 0.5);
          set({
            queue: currentVideo ? [currentVideo, ...shuffled] : shuffled,
            currentIndex: 0,
            isShuffled: true,
          });
        }
      },

      getCurrentVideo: () => {
        const { queue, currentIndex } = get();
        return queue[currentIndex] || null;
      },

      hasNext: () => {
        const { queue, currentIndex } = get();
        return currentIndex < queue.length - 1;
      },

      hasPrevious: () => {
        const { currentIndex } = get();
        return currentIndex > 0;
      },

      addToQueue: (video) => {
        const { queue, isManualQueue, playlistId } = get();
        
        // Check if video already in queue
        if (queue.some(v => v._id === video._id)) {
          return;
        }
        
        // If we're in playlist mode, just add to the end
        // If no queue exists, start a manual queue
        if (queue.length === 0 || (!playlistId && !isManualQueue)) {
          set({
            queue: [video],
            originalQueue: [video],
            currentIndex: 0,
            isManualQueue: true,
            playlistId: null,
            playlistName: null,
          });
        } else {
          set({
            queue: [...queue, video],
            originalQueue: [...queue, video],
          });
        }
      },

      removeFromQueue: (videoId) => {
        const { queue, currentIndex } = get();
        const newQueue = queue.filter(v => v._id !== videoId);
        const removedIndex = queue.findIndex(v => v._id === videoId);
        
        let newIndex = currentIndex;
        if (removedIndex < currentIndex) {
          newIndex = currentIndex - 1;
        } else if (removedIndex === currentIndex && currentIndex >= newQueue.length) {
          newIndex = Math.max(0, newQueue.length - 1);
        }
        
        set({
          queue: newQueue,
          originalQueue: newQueue,
          currentIndex: newIndex,
        });
      },

      isInQueue: (videoId) => {
        const { queue } = get();
        return queue.some(v => v._id === videoId);
      },
    }),
    {
      name: 'playlist-queue-storage',
    }
  )
);
