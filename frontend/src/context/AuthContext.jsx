import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const API_URL = 'http://localhost:3001/api';

  // Verificar token al cargar
  useEffect(() => {
    if (token) {
      verificarToken();
    }
  }, []);

  const verificarToken = async () => {
    try {
      const respuesta = await axios.get(`${API_URL}/auth/perfil`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuario(respuesta.data.data);
    } catch (error) {
      console.error('Token inválido');
      localStorage.removeItem('token');
      setToken(null);
    }
  };

  const registro = async (nombre, email, contrasenia, confirmarContrasenia) => {
    try {
      setCargando(true);
      setError('');
      
      const respuesta = await axios.post(`${API_URL}/auth/registro`, {
        nombre,
        email,
        contrasenia,
        confirmarContrasenia
      });

      return respuesta.data;
    } catch (error) {
      const mensaje = error.response?.data?.mensaje || 'Error en registro';
      setError(mensaje);
      throw error;
    } finally {
      setCargando(false);
    }
  };

  const login = async (email, contrasenia) => {
    try {
      setCargando(true);
      setError('');
      
      const respuesta = await axios.post(`${API_URL}/auth/login`, {
        email,
        contrasenia
      });

      // Si 2FA es requerido, devolver la respuesta tal cual
      if (respuesta.data.dos_fa_requerido) {
        return respuesta.data;  // ← Importante: devolver completo
      }

      // Si no es 2FA, guardar token
      localStorage.setItem('token', respuesta.data.token);
      setToken(respuesta.data.token);
      setUsuario(respuesta.data.usuario);

      return respuesta.data;
    } catch (error) {
      const mensaje = error.response?.data?.mensaje || 'Error en login';
      setError(mensaje);
      throw error;
    } finally {
      setCargando(false);
    }
  };

  const generarDosFA = async (usuario_id) => {
    try {
      setCargando(true);
      setError('');
      
      const respuesta = await axios.post(`${API_URL}/auth/generar-2fa`, {
        usuario_id
      });

      return respuesta.data;
    } catch (error) {
      const mensaje = error.response?.data?.mensaje || 'Error generando 2FA';
      setError(mensaje);
      throw error;
    } finally {
      setCargando(false);
    }
  };

  const verificarDosFA = async (usuario_id, codigo) => {
    try {
      setCargando(true);
      setError('');
      
      const respuesta = await axios.post(`${API_URL}/auth/verificar-2fa`, {
        usuario_id,
        codigo
      });

      localStorage.setItem('token', respuesta.data.token);
      setToken(respuesta.data.token);
      setUsuario(respuesta.data.usuario);

      return respuesta.data;
    } catch (error) {
      const mensaje = error.response?.data?.mensaje || 'Código incorrecto';
      setError(mensaje);
      throw error;
    } finally {
      setCargando(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUsuario(null);
    setError('');
  };

  const value = {
    usuario,
    token,
    cargando,
    error,
    registro,
    login,
    generarDosFA,
    verificarDosFA,
    logout,
    estaAutenticado: !!token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return contexto;
}