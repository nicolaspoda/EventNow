export const Role = {
  CLIENT: 'CLIENT',
  ORGANIZER: 'ORGANIZER',
  STAFF: 'STAFF',
} as const;

export type Role = typeof Role[keyof typeof Role];

export interface User {
  id: string;
  username?: string | null;
  email: string;
  role: Role;
  avatarUrl?: string | null;
  createdAt?: string;
}

export interface UserProfile extends User {
  followersCount?: number;
  followingCount?: number;
  friendsCount?: number;
  stats: {
    ordersCount: number;
    reviewsCount: number;
    eventsOrganized: number;
    averageRatingAsParticipant?: number | null;
    totalReviewsAsParticipant?: number;
    averageRatingOnMyEvents?: number | null;
    totalReviewsOnMyEvents?: number;
  };
}

export interface UpdateProfileData {
  avatarUrl?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface RegisterOrganizerData {
  username: string;
  email: string;
  password: string;
  organizationName?: string;
  confirmOrganizer: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SearchUserResult {
  id: string;
  username: string | null;
  avatarUrl: string | null;
}
