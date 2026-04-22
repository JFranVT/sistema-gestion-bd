import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { estaAutenticado, cargando } = useAuth();

  if (cargando) {
    return <div className="p-10 text-center">⏳ Cargando...</div>;
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  return children;
}