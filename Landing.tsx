import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ paddingTop: '4rem' }}>
      <div className="max-w-4xl mx-auto text-center space-y-12">
        <div className="space-y-6">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Bienvenido a <span className="block">Uni<span className="red-accent">teams</span></span>
            </h1>
          <p className="text-xl sm:text-2xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Construye equipos increíbles, colabora sin límites y alcanza tus metas
            juntos.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/signup">
            <Button
              variant="primary"
              className="w-full sm:w-auto px-8 py-4 text-lg"
            >
              Comenzar
            </Button>
          </Link>
          <Link to="/signin">
            <Button
              variant="secondary"
              className="w-full sm:w-auto px-8 py-4 text-lg"
            >
              Iniciar Sesión
            </Button>
          </Link>
        </div>

        <div className="pt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center">
                <span className="text-black text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white">Crear Equipos</h3>
              <p className="text-neutral-400">
                Construye y organiza tus equipos con facilidad
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center">
                <span className="text-black text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white">Colaborar</h3>
              <p className="text-neutral-400">
                Trabaja en equipo sin problemas en tus proyectos
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center">
                <span className="text-black text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white">
                Alcanzar Metas
              </h3>
              <p className="text-neutral-400">
                Logra tus objetivos más rápido en equipo
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


