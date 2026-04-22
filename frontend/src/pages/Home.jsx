import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export function Home() {
  const [usuarios, setUsuarios] = useState([]);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const { usuario, logout, token } = useAuth();
  const navigate = useNavigate();
  const API_URL = 'http://localhost:3001/api/usuarios';

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const respuesta = await axios.get(API_URL);
      setUsuarios(respuesta.data.data);
    } catch (error) {
      setMensaje('❌ Error al cargar usuarios');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre || !email) {
      setMensaje('⚠️ Completa todos los campos');
      return;
    }

    try {
      setCargando(true);
      if (editandoId) {
        await axios.put(`${API_URL}/${editandoId}`, { nombre, email });
        setMensaje('✅ Usuario actualizado');
        setEditandoId(null);
      } else {
        await axios.post(API_URL, { nombre, email });
        setMensaje('✅ Usuario creado');
      }
      setNombre('');
      setEmail('');
      cargarUsuarios();
    } catch (error) {
      setMensaje('❌ Error al guardar');
    } finally {
      setCargando(false);
    }
  };

  const handleEditar = (u) => {
    setEditandoId(u.id);
    setNombre(u.nombre);
    setEmail(u.email);
  };

  const handleCancelar = () => {
    setEditandoId(null);
    setNombre('');
    setEmail('');
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Eliminar?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        setMensaje('✅ Usuario eliminado');
        cargarUsuarios();
      } catch {
        setMensaje('❌ Error');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header con Usuario */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">🎯 Dashboard</h1>
            <p className="text-gray-600">Bienvenido, {usuario?.nombre}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
          >
            🚪 Logout
          </button>
        </div>

        {mensaje && (
          <div className="mb-6 p-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 rounded">
            {mensaje}
          </div>
        )}

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editandoId ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={cargando}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
              >
                {editandoId ? '🔄 Actualizar' : '✨ Crear'}
              </button>
              {editandoId && (
                <button
                  type="button"
                  onClick={handleCancelar}
                  className="flex-1 bg-gray-400 text-white py-2 rounded-lg font-semibold hover:bg-gray-500"
                >
                  ❌ Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <h2 className="text-2xl font-bold text-white">👥 Usuarios ({usuarios.length})</h2>
          </div>

          {usuarios.length === 0 ? (
            <div className="p-6 text-center text-gray-500">📭 No hay usuarios</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">ID</th>
                    <th className="px-6 py-3 text-left font-semibold">Nombre</th>
                    <th className="px-6 py-3 text-left font-semibold">Email</th>
                    <th className="px-6 py-3 text-left font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold">{u.id}</td>
                      <td className="px-6 py-4">{u.nombre}</td>
                      <td className="px-6 py-4">{u.email}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => handleEditar(u)}
                          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleEliminar(u.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}