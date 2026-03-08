import { api } from './api';

export const followService = {
  follow: async (userId: string) => {
    const response = await api.post(`/follows/user/${userId}`);
    return response.data;
  },

  unfollow: async (userId: string) => {
    const response = await api.delete(`/follows/user/${userId}`);
    return response.data;
  },

  isFollowing: async (userId: string): Promise<{ following: boolean }> => {
    const response = await api.get<{ following: boolean }>(`/follows/user/${userId}/check`);
    return response.data;
  },

  getFollowers: async (userId: string) => {
    const response = await api.get(`/follows/user/${userId}/followers`);
    return response.data;
  },

  getFollowing: async (userId: string) => {
    const response = await api.get(`/follows/user/${userId}/following`);
    return response.data;
  },

  getFriends: async (userId: string) => {
    const response = await api.get(`/follows/user/${userId}/friends`);
    return response.data;
  },

  setNotifications: async (userId: string, enabled: boolean) => {
    const response = await api.patch(`/follows/user/${userId}/notifications`, { enabled });
    return response.data;
  },
};
