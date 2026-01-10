import { create } from 'zustand';
import apiClient from '@/lib/api';

interface Playlist {
  _id: string;
  name: string;
  description: string;
  videos: string[] | any[]; // IDs or objects depending on populate
  owner: string;
  createdAt: string;
}

interface PlaylistStore {
  playlists: Playlist[];
  isLoading: boolean;
  fetchUserPlaylists: (userId: string) => Promise<void>;
  createPlaylist: (name: string, description: string, videoId?: string) => Promise<void>;
  addVideoToPlaylist: (playlistId: string, videoId: string) => Promise<void>;
  removeVideoFromPlaylist: (playlistId: string, videoId: string) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  getPlaylistById: (playlistId: string) => Promise<Playlist | null>;
}

export const usePlaylistStore = create<PlaylistStore>((set, get) => ({
  playlists: [],
  isLoading: false,

  getPlaylistById: async (playlistId: string) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get(`/playlists/${playlistId}`);
      return response.data.data;
    } catch (error) {
      console.error("Failed to fetch playlist", error);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUserPlaylists: async (userId: string) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get(`/playlists/user/${userId}`);
      set({ playlists: response.data.data.playlists || [] });
    } catch (error) {
      console.error("Failed to fetch playlists", error);
    } finally {
      set({ isLoading: false });
    }
  },

  createPlaylist: async (name: string, description: string, videoId?: string) => {
    try {
      const response = await apiClient.post('/playlists', { name, description, videoId });
      const newPlaylist = response.data.data;
      set((state) => ({ playlists: [newPlaylist, ...state.playlists] }));
    } catch (error) {
      console.error("Failed to create playlist", error);
      throw error;
    }
  },

  addVideoToPlaylist: async (playlistId: string, videoId: string) => {
    try {
      await apiClient.patch(`/playlists/add/${videoId}/${playlistId}`);
      // Optimistic update could happen here, but simplest is to just re-fetch or let specific list components handle it
    } catch (error) {
      console.error("Failed to add video to playlist", error);
      throw error;
    }
  },

  removeVideoFromPlaylist: async (playlistId: string, videoId: string) => {
    try {
        await apiClient.patch(`/playlists/remove/${videoId}/${playlistId}`);
    } catch (error) {
        console.error("Failed to remove video from playlist", error);
        throw error;
    }
  },

  deletePlaylist: async (playlistId: string) => {
      try {
          await apiClient.delete(`/playlists/${playlistId}`);
          set((state) => ({ 
              playlists: state.playlists.filter(p => p._id !== playlistId) 
          }));
      } catch (error) {
          console.error("Failed to delete playlist", error);
          throw error;
      }
  }
}));