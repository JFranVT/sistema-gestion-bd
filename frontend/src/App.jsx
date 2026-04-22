import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Registro } from './pages/Registro';
import { Verificar2FA } from './pages/Verificar2FA';

function AppRoutes() {
  const { estaAutenticado, cargando } = useAuth();

  if (cargando) {
    return <div className="p-10 text-center">⏳ Cargando...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={estaAutenticado ? <Navigate to="/" /> : <Login />} />
      <Route path="/registro" element={estaAutenticado ? <Navigate to="/" /> : <Registro />} />
      <Route path="/verificar-2fa" element={<Verificar2FA />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;