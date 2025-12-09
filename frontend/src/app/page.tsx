'use client';

import { AuthForm } from '@/components/AuthForm';
import { Dashboard } from '@/components/Dashboard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import type { ReactElement } from 'react';

export default function Home(): ReactElement {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  return <Dashboard />;
}
