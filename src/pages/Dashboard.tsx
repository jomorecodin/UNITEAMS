import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const Dashboard: React.FC = () => {
  const { user, profile, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-black px-4 sm:px-6 lg:px-8" style={{ paddingTop: '5rem', paddingBottom: '3rem' }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to your Dashboard
          </h1>
          <p className="text-neutral-400 text-lg">
            Hello, {profile?.display_name || profile?.first_name || user?.email}! This is your personal workspace.
          </p>
          {profile && (
            <div className="mt-4 text-sm text-neutral-500">
              <p>Email: {profile.email}</p>
              {profile.first_name && profile.last_name && (
                <p>Full Name: {profile.first_name} {profile.last_name}</p>
              )}
              <p>Role: {profile.role}</p>
              <p>Member since: {new Date(profile.created_at).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-xl">👥</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Teams</h3>
              <p className="text-neutral-400 text-sm">
                Manage your teams and collaborate with others
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Projects
              </h3>
              <p className="text-neutral-400 text-sm">
                Track your projects and monitor progress
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-xl">⚙️</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Settings
              </h3>
              <p className="text-neutral-400 text-sm">
                Customize your account and preferences
              </p>
            </div>
          </Card>
        </div>

        <Card className="p-8">
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-semibold text-white">
              Getting Started
            </h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">
              This is a placeholder dashboard. In a real application, you would
              see your teams, projects, notifications, and other relevant
              information here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary">Create Team</Button>
              <Button variant="secondary">Join Team</Button>
            </div>
          </div>
        </Card>

        <div className="text-center mt-8">
          <Button
            variant="secondary"
            onClick={handleSignOut}
            loading={loading}
            className="px-6 py-3"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};


