// Importar Express
const express = require('express');

// Crear la aplicación
const app = express();

// ⭐ MIDDLEWARES (DEBEN IR PRIMERO)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Definir el puerto
const PORT = 3001;

// Base de datos temporal (solo en memoria)
let usuarios = [
  { id: 1, nombre: 'Juan', email: 'juan@example.com' },
  { id: 2, nombre: 'María', email: 'maria@example.com' }
];

// ===== RUTAS GET =====

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    mensaje: '¡Bienvenido al servidor!',
    version: '1.0.0'
  });
});

// Obtener todos los usuarios
app.get('/api/usuarios', (req, res) => {
  res.json({
    success: true,
    data: usuarios,
    cantidad: usuarios.length
  });
});

// Obtener un usuario por ID
app.get('/api/usuarios/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const usuario = usuarios.find(u => u.id === id);
  
  if (usuario) {
    res.json({
      success: true,
      data: usuario
    });
  } else {
    res.status(404).json({
      success: false,
      mensaje: 'Usuario no encontrado'
    });
  }
});

// ===== RUTAS POST =====

// Crear un nuevo usuario
app.post('/api/usuarios', (req, res) => {
  try {
    console.log('Body recibido:', req.body);
    
    const { nombre, email } = req.body;
    
    // Validación
    if (!nombre || !email) {
      return res.status(400).json({
        success: false,
        mensaje: 'Nombre y email son requeridos'
      });
    }
    
    // Crear nuevo usuario
    const nuevoUsuario = {
      id: usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1,
      nombre,
      email
    };
    
    usuarios.push(nuevoUsuario);
    
    res.status(201).json({
      success: true,
      mensaje: 'Usuario creado exitosamente',
      data: nuevoUsuario
    });
  } catch (error) {
    console.error('Error en POST:', error.message);
    res.status(500).json({
      success: false,
      mensaje: 'Error al crear usuario',
      error: error.message
    });
  }
});

// ===== RUTAS PUT =====

// Actualizar un usuario
app.put('/api/usuarios/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, email } = req.body;
    
    const usuario = usuarios.find(u => u.id === id);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario no encontrado'
      });
    }
    
    // Actualizar datos
    if (nombre) usuario.nombre = nombre;
    if (email) usuario.email = email;
    
    res.json({
      success: true,
      mensaje: 'Usuario actualizado exitosamente',
      data: usuario
    });
  } catch (error) {
    console.error('Error en PUT:', error.message);
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar usuario',
      error: error.message
    });
  }
});

// ===== RUTAS DELETE =====

// Eliminar un usuario
app.delete('/api/usuarios/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const indice = usuarios.findIndex(u => u.id === id);
    
    if (indice === -1) {
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario no encontrado'
      });
    }
    
    const usuarioEliminado = usuarios.splice(indice, 1);
    
    res.json({
      success: true,
      mensaje: 'Usuario eliminado exitosamente',
      data: usuarioEliminado[0]
    });
  } catch (error) {
    console.error('Error en DELETE:', error.message);
    res.status(500).json({
      success: false,
      mensaje: 'Error al eliminar usuario',
      error: error.message
    });
  }
});

// ===== MANEJO DE ERRORES =====

// Ruta no encontrada (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    mensaje: 'Ruta no encontrada'
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`✓ Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`✓ Prueba: GET http://localhost:${PORT}/api/usuarios`);
});