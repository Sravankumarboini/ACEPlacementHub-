import { create } from 'zustand';
import type { Notification } from '@shared/schema';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isDropdownOpen: boolean;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  toggleDropdown: () => void;
  closeDropdown: () => void;
  markAsRead: (id: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isDropdownOpen: false,
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  toggleDropdown: () => set((state) => ({ isDropdownOpen: !state.isDropdownOpen })),
  closeDropdown: () => set({ isDropdownOpen: false }),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
}));
