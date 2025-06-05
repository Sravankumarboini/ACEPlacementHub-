import { apiRequest } from './queryClient';
import type { User, InsertUser } from '@shared/schema';

export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  const response = await apiRequest('POST', '/api/auth/login', { email, password });
  return response.json();
}

export async function register(userData: InsertUser): Promise<{ user: User; token: string }> {
  const response = await apiRequest('POST', '/api/auth/register', userData);
  return response.json();
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiRequest('GET', '/api/auth/me');
  return response.json();
}

export function getAuthHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
