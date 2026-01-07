import React from 'react';
import { User, UserRole } from '../types';
import AdminAnalytics from './AdminAnalytics';
import AuthorAnalytics from './AuthorAnalytics';
import { AuthorAnalyticsSession } from '../services/authorAnalyticsService';

type StatsPanelProps = {
  user: User;
  token: string | null;
};

const StatsPanel: React.FC<StatsPanelProps> = ({ user, token }) => {
  if (user.role === UserRole.AUTHOR) {
    const session: AuthorAnalyticsSession | null = token ? { token } : null;
    return <AuthorAnalytics session={session} />;
  }

  return <AdminAnalytics session={token ? { token } : null} />;
};

export default StatsPanel;
