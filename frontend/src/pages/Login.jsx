import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [mensaje, setMensaje] = useState('');

  const { login, cargando } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const resultado = await login(email, contrasenia);
      
      if (resultado.dos_fa_requerido) {
        // Ir a pantalla de 2FA
        navigate('/verificar-2fa', { 
          state: { 
            usuario_id: resultado.usuario_id,
            email: resultado.email,
            es_registro: false
          } 
        });
      } else {
        setMensaje('✅ Login exitoso. Redirigiendo...');
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (error) {
      setMensaje('❌ Email o contraseña incorrectos');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          🔐 Login
        </h1>

        {mensaje && (
          <div className="mb-4 p-3 bg-blue-100 border-l-4 border-blue-500 text-blue-700 rounded">
            {mensaje}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={contrasenia}
              onChange={(e) => setContrasenia(e.target.value)}
              placeholder="Tu contraseña"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {cargando ? '⏳ Ingresando...' : '🔓 Ingresar'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-blue-600 font-semibold hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}