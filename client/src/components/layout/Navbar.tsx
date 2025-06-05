import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { StudentNavbar } from './StudentNavbar';
import { FacultyNavbar } from './FacultyNavbar';

export function Navbar() {
  const { user } = useAuthStore();

  if (!user) return null;

  if (user.role === 'student') {
    return <StudentNavbar />;
  } else if (user.role === 'faculty') {
    return <FacultyNavbar />;
  }

  return null;
}
