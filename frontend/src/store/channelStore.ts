import { create } from 'zustand';

interface Channel {
  _id: string;
  name: string;
  description: string;
  owner: string;
  avatar?: string;
  banner?: string;
  subscribers?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface ChannelStore {
  channels: Channel[];
  currentChannel: Channel | null;
  isLoading: boolean;
  error: string | null;
  setChannels: (channels: Channel[]) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  addChannel: (channel: Channel) => void;
  updateChannel: (channelId: string, updates: Partial<Channel>) => void;
  removeChannel: (channelId: string) => void;
  clearChannels: () => void;
}

export const useChannelStore = create<ChannelStore>((set) => ({
  channels: [],
  currentChannel: null,
  isLoading: false,
  error: null,
  setChannels: (channels) => set({ channels }),
  setCurrentChannel: (channel) => set({ currentChannel: channel }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addChannel: (channel) => set((state) => ({ channels: [...state.channels, channel] })),
  updateChannel: (channelId, updates) => 
    set((state) => ({
      channels: state.channels.map((ch) => 
        ch._id === channelId ? { ...ch, ...updates } : ch
      ),
      currentChannel: state.currentChannel?._id === channelId 
        ? { ...state.currentChannel, ...updates } 
        : state.currentChannel
    })),
  removeChannel: (channelId) => 
    set((state) => ({
      channels: state.channels.filter((ch) => ch._id !== channelId),
      currentChannel: state.currentChannel?._id === channelId ? null : state.currentChannel
    })),
  clearChannels: () => set({ channels: [], currentChannel: null, error: null }),
}));
