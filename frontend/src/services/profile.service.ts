import { api } from './api';
import type { User, UserProfile, UpdateProfileData } from '../types/auth';

export interface PublicUserProfile {
  id: string;
  email: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  createdAt: string;
  isFollowing?: boolean;
  followersCount?: number;
  followingCount?: number;
  notificationsEnabled?: boolean;
  participatedEvents: Array<{
    id: string;
    title: string;
    eventDate: string;
    location: string;
    imageUrl?: string;
    type: string;
    category: string;
  }>;
  participantReviews: Array<{
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
    reviewerName: string;
  }>;
  stats: {
    averageRating: number | null;
    totalReviews: number;
    participatedEventsCount: number;
    averageRatingOnMyEvents?: number | null;
    totalReviewsOnMyEvents?: number;
  };
}

export const profileService = {
  async getProfile(): Promise<UserProfile> {
    const response = await api.get<UserProfile>('/auth/profile');
    return response.data;
  },

  async updateProfile(data: UpdateProfileData): Promise<User> {
    const response = await api.put<User>('/auth/profile', data);
    return response.data;
  },

  async getUserPublicProfile(userId: string): Promise<PublicUserProfile> {
    const response = await api.get<PublicUserProfile>(`/auth/user/${userId}/public-profile`);
    return response.data;
  },
};
