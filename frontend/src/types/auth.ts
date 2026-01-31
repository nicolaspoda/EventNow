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
