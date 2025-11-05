import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Landing } from '../pages/Landing';
import { SignUp } from '../pages/SignUp';
import { SignIn } from '../pages/SignIn';
import { Dashboard } from '../pages/Dashboard';
import SubjectsRegister from '../pages/SubjectsRegister';
import { CreateGroupPage } from '../pages/CreateTeamPage';
import { StudyGroupsPage } from '../pages/StudyGroupsPage';
import AcceptTutor from '../pages/AcceptTutor';
import { MyStudyGroupsPage } from '../pages/MyStudyGroupsPage';
import NewRequest from '../pages/NewRequest';
import { ApplyToGroupPage } from '../pages/ApplyToGroupPage';
import { GroupTutorRequestsPage } from '../pages/GroupTutorRequestsPage';
import { NotFound } from '../pages/NotFound';

export const AppRouter: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-black flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Rutas públicas - redirigen si están autenticados */}
              <Route 
                path="/" 
                element={
                  <PublicRoute>
                    <Landing />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/signup" 
                element={
                  <PublicRoute>
                    <SignUp />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/signin" 
                element={
                  <PublicRoute>
                    <SignIn />
                  </PublicRoute>
                } 
              />
              
              {/* Rutas protegidas - requieren autenticación */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/subjects-register" 
                element={
                  <ProtectedRoute>
                    <SubjectsRegister />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/create-group" 
                element={
                  <ProtectedRoute>
                    <CreateGroupPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/study-groups" 
                element={
                  <ProtectedRoute>
                    <StudyGroupsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/accept-tutor" 
                element={
                  <ProtectedRoute>
                    <AcceptTutor />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/my-groups" 
                element={
                  <ProtectedRoute>
                    <MyStudyGroupsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/requests/new" 
                element={
                  <ProtectedRoute>
                    <NewRequest />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/apply-to-group" 
                element={
                  <ProtectedRoute>
                    <ApplyToGroupPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/groups/:groupId/requests" 
                element={
                  <ProtectedRoute>
                    <GroupTutorRequestsPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Ruta catch-all para páginas no encontradas */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};


