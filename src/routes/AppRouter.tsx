import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Landing } from '../pages/Landing';
import { SignUp } from '../pages/SignUp';
import { SignIn } from '../pages/SignIn';
import { Dashboard } from '../pages/Dashboard';

export const AppRouter: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-black flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/signin" element={<SignIn />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};


