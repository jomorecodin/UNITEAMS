import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
// import { Card } from '../components/Card';
// import { Button } from '../components/Button';
// import { Link } from 'react-router-dom';

export const ApplyTutor: React.FC = () => {
    // const { user, profile, signOut, loading } = useAuth();
    // const handleSignOut = async () => {
    //     await signOut();
    // }
  

  return (
    
    <AuthLayout
    title="Aplica para ser Tutor"
    subtitle="Únete a Uniteams y comienza a colaborar"
    >
        <form className="space-y-6">

        </form>


    </AuthLayout>
            

  );
}