// src/pages/SignIn.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; // ¡Importa el cliente de Supabase!

// Asumo que tienes componentes como Input y Button
import {Input} from "../components/Input";
import {Button} from "../components/Button";

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  // Esta es la función que se ejecuta al enviar el formulario
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    // ¡ESTA ES LA FORMA CORRECTA DE INICIAR SESIÓN!
    // Llama directamente a la función de supabase
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setErrorMessage(error.message); // Muestra el error de Supabase al usuario
    } else {
      // Si el inicio de sesión es exitoso, el AuthContext se actualizará solo.
      // Solo necesitamos redirigir al usuario al dashboard.
      navigate('/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      {/* ... Tu layout de autenticación ... */}
      <form onSubmit={handleSubmit}>
        <Input
          label="Correo Electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="@ printzxy@gmail.com"
          required
        />
        <Input
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        {/* Muestra el mensaje de error si existe */}
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {/* ... Recordarme y Olvidaste tu contraseña ... */}
        
        <Button type="submit" disabled={loading}>
          {loading ? 'Cargando...' : 'Iniciar Sesión'}
        </Button>
      </form>

      <p>
        ¿No tienes una cuenta? <Link to="/signup">Registrarse</Link>
      </p>
    </div>
  );
};

export default SignIn;
//3.  **En tu componente `Button.tsx`**: A veces los desarrolladores hacen que un botón sea un link. Revisa si tu componente `<Button>` renderiza una etiqueta `<a>` y lo estás envolviendo en un `<Link>`//Simplemente busca en tu código los lugares donde un `<Link>` puede estar anidado dentro de otro y elimina el que esté de más.
//l aplicar la corrección en `SignIn.tsx`, tu problema de inicio de sesión se resolverá por completo.