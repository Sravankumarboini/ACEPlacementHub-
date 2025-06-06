import { apiRequest } from './queryClient';
import type { User, InsertUser } from '@shared/schema';

interface AuthResponse {
  user: User;
  token: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await apiRequest('POST', '/api/auth/login', { email, password });
  const data = await response.json();
  
  if (data.token) {
    localStorage.setItem('auth-token', data.token);
  }
  
  return data;
}

export async function register(userData: InsertUser): Promise<AuthResponse> {
  const response = await apiRequest('POST', '/api/auth/register', userData);
  const data = await response.json();
  
  if (data.token) {
    localStorage.setItem('auth-token', data.token);
  }
  
  return data;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await apiRequest('GET', '/api/auth/me');
    return await response.json();
  } catch (error) {
    localStorage.removeItem('auth-token');
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem('auth-token');
}