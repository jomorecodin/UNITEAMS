// src/components/Navbar.tsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Logo } from './Logo'; // Asegúrate de que la ruta a tu Logo sea correcta

const Navbar = () => {
  // 1. Usamos el hook para acceder a la sesión
  const { session } = useAuth();
  const navigate = useNavigate();

  // 2. Esta es la función CORRECTA para cerrar sesión
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error al cerrar sesión:', error);
    } else {
      // Opcional: Redirigir al usuario a la página de inicio.
      // El cambio de estado en la UI será automático gracias al AuthContext.
      navigate('/signin'); 
    }
  };

  return (
    <nav /* tus clases de css */>
      <Link to={session ? "/dashboard" : "/"}>
        <Logo />
      </Link>
      
      <div>
        {session ? (
          // 3. Si HAY sesión, mostramos el email y el botón de logout
          <div className="flex items-center gap-4">
            <span>{session.user.email}</span>
            <button onClick={handleLogout} className="logout-button">
              Cerrar Sesión
            </button>
          </div>
        ) : (
          // 4. Si NO HAY sesión, mostramos los botones de login/signup
          <div className="flex items-center gap-4">
            <Link to="/signin" className="nav-button">
              Iniciar Sesión
            </Link>
            <Link to="/signup" className="nav-button-primary">
              Comenzar
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;