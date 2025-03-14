import axios from "axios";
import { headers } from "next/headers";

const API_URl = "http://localhost:3000/api";

export const userApi = {
  register: async (userData) => {
    const formData = new FormData();
    Object.keys(userData).forEach((key) => formData.append(key, userData[key]));
    return await axios.post(`${API_URl}/auth/register`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  login: async (credentials) => {
    return await axios.post(`${API_URl}/login`, credentials);
  },
  logout: async () => {
    return await axios.post(
      `${API_URl}/logout`,
      {},
      {
        headers: {
          Authorization: 'Bearer ${localStorage.getItem("accessToken")}',
        },
      }
    );
  },

  refreshToken: async () => {
    return axios.post(`${API_URl}/refresh-token`);
  },

  changePassword: async (passwords) => {
    return axios.post(`${API_URl}/change-password`, passwords, {
      headers: {
        Authorization: 'Bearer ${localStorage.getItem("accessToken")}',
      },
    });
  },

  getCurrentUser: async () => {
    return axios.get(`${API_URL}/current-user`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
  },

  updateAccountDetails: async (accountData) => {
    return axios.patch(`${API_URL}/update-account-details`, accountData, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
  },

  updateAvatar: async (avatarFile) => {
    const formData = new FormData();
    formData.append("avatar", avatarFile);
    return axios.patch(`${API_URL}/update-avatar`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
  },

  updateCoverImage: async (coverImageFile) => {
    const formData = new FormData();
    formData.append("coverImage", coverImageFile);
    return axios.patch(`${API_URL}/cover-Image`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
  },

  getUserChannelProfile: async (username) => {
    return axios.get(`${API_URL}/c/${username}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
  },

  getWatchHistory: async () => {
    return axios.get(`${API_URL}/watch-History`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
  },
};