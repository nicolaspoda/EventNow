import { api } from './api';
import type {
  AuthResponse,
  LoginData,
  RegisterData,
  RegisterOrganizerData,
  User,
  SearchUserResult,
} from '../types/auth';

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    this.saveAuthData(response.data);
    return response.data;
  },

  async registerOrganizer(data: RegisterOrganizerData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register-organizer', data);
    this.saveAuthData(response.data);
    return response.data;
  },

  async searchUsersByUsername(query: string, limit = 15): Promise<SearchUserResult[]> {
    const q = encodeURIComponent(query.trim());
    if (!q) return [];
    const { data } = await api.get<SearchUserResult[]>(
      `/auth/users/search?q=${q}&limit=${limit}`,
    );
    return data;
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    this.saveAuthData(response.data);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  async logout() {
    const refreshToken = sessionStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch {
        // Ignore errors
      }
    }
    this.clearSession();
  },

  clearSession() {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
  },

  saveAuthData(data: AuthResponse) {
    sessionStorage.setItem('accessToken', data.accessToken);
    sessionStorage.setItem('refreshToken', data.refreshToken);
    sessionStorage.setItem('user', JSON.stringify(data.user));
  },

  getUser(): User | null {
    const userStr = sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return !!sessionStorage.getItem('accessToken');
  },
};
