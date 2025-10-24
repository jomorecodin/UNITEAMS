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
import  SubjectsRegister  from '../pages/SubjectsRegister';
import { CreateGroupPage } from '../pages/CreateTeamPage';
import { StudyGroupsPage } from '../pages/StudyGroupsPage';
import AcceptTutor from '../pages/AcceptTutor';
import { MyStudyGroupsPage } from '../pages/MyStudyGroupsPage';
import NewRequest from '../pages/NewRequest';

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
              
              <Route path="/subjects-register" element={<SubjectsRegister />} />  
              <Route path="/create-group" element={<CreateGroupPage />} />
              <Route path="/study-groups" element={<StudyGroupsPage />} />
              <Route path="/accept-tutor" element={<AcceptTutor />} />  
              <Route path="/my-groups" element={<MyStudyGroupsPage />} />
              <Route path="/requests/new" element={<NewRequest />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};


