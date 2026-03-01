import { api } from './api';
import type { AuthResponse, LoginData, RegisterData, User } from '../types/auth';

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    this.saveAuthData(response.data);
    return response.data;
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
