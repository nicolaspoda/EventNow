export const Role = {
  CLIENT: 'CLIENT',
  ORGANIZER: 'ORGANIZER',
  STAFF: 'STAFF',
} as const;

export type Role = typeof Role[keyof typeof Role];

export interface User {
  id: string;
  email: string;
  role: Role;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
}

export interface UserProfile extends User {
  followersCount?: number;
  followingCount?: number;
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
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role: Role;
}

export interface LoginData {
  email: string;
  password: string;
}
