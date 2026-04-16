import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [usuarios, setUsuarios] = useState([]);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const API_URL = 'http://localhost:3001/api/usuarios';

  // Obtener usuarios al cargar
  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      const respuesta = await axios.get(API_URL);
      setUsuarios(respuesta.data.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setMensaje('❌ Error al cargar usuarios. ¿El Backend está ejecutándose?');
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre || !email) {
      setMensaje('⚠️ Por favor completa todos los campos');
      return;
    }

    try {
      if (editandoId) {
        // Actualizar usuario
        await axios.put(`${API_URL}/${editandoId}`, { nombre, email });
        setMensaje('✅ Usuario actualizado correctamente');
        setEditandoId(null);
      } else {
        // Crear nuevo usuario
        await axios.post(API_URL, { nombre, email });
        setMensaje('✅ Usuario creado correctamente');
      }

      setNombre('');
      setEmail('');
      cargarUsuarios();
    } catch (error) {
      setMensaje('❌ ' + (error.response?.data?.mensaje || 'Error al guardar usuario'));
    }
  };

  const handleEditar = (usuario) => {
    setEditandoId(usuario.id);
    setNombre(usuario.nombre);
    setEmail(usuario.email);
    setMensaje('');
  };

  const handleCancelar = () => {
    setEditandoId(null);
    setNombre('');
    setEmail('');
    setMensaje('');
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        setMensaje('✅ Usuario eliminado correctamente');
        cargarUsuarios();
      } catch (error) {
        setMensaje('❌ Error al eliminar usuario');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎯 Sistema de Gestión de Usuarios
          </h1>
          <p className="text-gray-600">Crea, actualiza y elimina usuarios fácilmente</p>
        </div>

        {/* Mensaje de estado */}
        {mensaje && (
          <div className="mb-6 p-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 rounded animate-pulse">
            {mensaje}
          </div>
        )}

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editandoId ? '✏️ Editar Usuario' : '➕ Crear Nuevo Usuario'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ingresa el nombre"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ingresa el email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                {editandoId ? '🔄 Actualizar' : '✨ Crear'}
              </button>

              {editandoId && (
                <button
                  type="button"
                  onClick={handleCancelar}
                  className="flex-1 bg-gray-400 text-white py-2 rounded-lg font-semibold hover:bg-gray-500 transition"
                >
                  ❌ Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista de usuarios */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <h2 className="text-2xl font-bold text-white">
              👥 Usuarios ({usuarios.length})
            </h2>
          </div>

          {cargando ? (
            <div className="p-6 text-center text-gray-500">
              ⏳ Cargando usuarios...
            </div>
          ) : usuarios.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              📭 No hay usuarios registrados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-gray-700 font-semibold">ID</th>
                    <th className="px-6 py-3 text-left text-gray-700 font-semibold">Nombre</th>
                    <th className="px-6 py-3 text-left text-gray-700 font-semibold">Email</th>
                    <th className="px-6 py-3 text-left text-gray-700 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-800 font-semibold">{usuario.id}</td>
                      <td className="px-6 py-4 text-gray-800">{usuario.nombre}</td>
                      <td className="px-6 py-4 text-gray-800">{usuario.email}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => handleEditar(usuario)}
                          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition font-semibold"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(usuario.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition font-semibold"
                        >
                          🗑️ Eliminar
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

export default App;