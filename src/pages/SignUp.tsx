// src/pages/SignUp.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; // Importa el cliente de Supabase

// Asumo que tienes componentes como Input y Button
import {Input} from '../components/Input';
import {Button} from '../components/Button';

const SignUp = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    // ¡AQUÍ ESTÁ LA LÓGICA CLAVE!
    // Se llama directamente a la función signUp de supabase
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        // Aquí puedes pasar datos adicionales que se guardarán en la tabla `profiles`
        // gracias al trigger que seguramente configuraste en Supabase.
        data: {
          full_name: `${firstName} ${lastName}`,
          // avatar_url: '', // podrías añadir esto más tarde
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
    } else if (data.user) {
      // ¡Éxito! Supabase enviará un correo de confirmación.
      // Puedes mostrar un mensaje al usuario.
      alert('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.');
      navigate('/signin'); // Redirige al login para que inicie sesión
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <h2>Crear una cuenta</h2>
      <form onSubmit={handleSubmit}>
        <div className="name-fields">
          <Input
            label="Nombre"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <Input
            label="Apellido"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <Input
          label="Correo Electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? 'Cargando...' : 'Crear Cuenta'}
        </Button>
      </form>
      <p>
        ¿Ya tienes una cuenta? <Link to="/signin">Iniciar sesión</Link>
      </p>
    </div>
  );
};

export default SignUp;