import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface CreateChannelData {
  name: string;
  description: string;
  avatar?: File;
}

export interface UpdateChannelData {
  name?: string;
  description?: string;
}

export const channelApi = {
  // Create a new channel
  createChannel: async (data: CreateChannelData) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    if (data.avatar) {
      formData.append("avatar", data.avatar);
    }

    const response = await api.post("/channels/create", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Get user's channels
  getUserChannels: async () => {
    const response = await api.get("/channels/user/me");
    return response.data;
  },

  // Get channel by ID
  getChannelById: async (channelId: string) => {
    const response = await api.get(`/channels/${channelId}`);
    return response.data;
  },

  // Update channel
  updateChannel: async (channelId: string, data: UpdateChannelData) => {
    const response = await api.patch(`/channels/${channelId}`, data);
    return response.data;
  },

  // Delete channel
  deleteChannel: async (channelId: string) => {
    const response = await api.delete(`/channels/${channelId}`);
    return response.data;
  },

  // Upload channel avatar
  uploadAvatar: async (channelId: string, avatar: File) => {
    const formData = new FormData();
    formData.append("avatar", avatar);

    const response = await api.post(`/channels/${channelId}/avatar`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Upload channel banner
  uploadBanner: async (channelId: string, banner: File) => {
    const formData = new FormData();
    formData.append("banner", banner);

    const response = await api.post(`/channels/${channelId}/banner`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Get channel subscribers
  getSubscribers: async (channelId: string) => {
    const response = await api.get(`/channels/${channelId}/subscribers`);
    return response.data;
  },

  // Toggle subscription
  toggleSubscription: async (channelId: string) => {
    const response = await api.post(`/channels/${channelId}/subscribe`);
    return response.data;
  },
};
