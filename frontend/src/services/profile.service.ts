import { api } from './api';
import type { User, UserProfile, UpdateProfileData } from '../types/auth';

export const profileService = {
  async getProfile(): Promise<UserProfile> {
    const response = await api.get<UserProfile>('/auth/profile');
    return response.data;
  },

  async updateProfile(data: UpdateProfileData): Promise<User> {
    const response = await api.put<User>('/auth/profile', data);
    return response.data;
  },
};
