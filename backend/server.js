// Importar Express y PostgreSQL
const express = require('express');
const pool = require('./db');

// Crear la aplicación
const app = express();

// ⭐ MIDDLEWARES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Definir el puerto
const PORT = 3001;

// ===== RUTAS GET =====

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    mensaje: '¡Bienvenido al servidor!',
    version: '2.0.0',
    bd: 'PostgreSQL'
  });
});

// Obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM usuarios ORDER BY id');
    
    res.json({
      success: true,
      data: resultado.rows,
      cantidad: resultado.rows.length
    });
  } catch (error) {
    console.error('Error en GET /api/usuarios:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener usuarios',
      error: error.message
    });
  }
});

// Obtener un usuario por ID
app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const resultado = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    
    if (resultado.rows.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error en GET /api/usuarios/:id:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener usuario',
      error: error.message
    });
  }
});

// ===== RUTAS POST =====

// Crear un nuevo usuario
app.post('/api/usuarios', async (req, res) => {
  try {
    const { nombre, email } = req.body;
    
    // Validación
    if (!nombre || !email) {
      return res.status(400).json({
        success: false,
        mensaje: 'Nombre y email son requeridos'
      });
    }
    
    // Insertar en la BD
    const resultado = await pool.query(
      'INSERT INTO usuarios (nombre, email) VALUES ($1, $2) RETURNING *',
      [nombre, email]
    );
    
    res.status(201).json({
      success: true,
      mensaje: 'Usuario creado exitosamente',
      data: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error en POST /api/usuarios:', error);
    
    // Verificar si el email ya existe
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        mensaje: 'El email ya está registrado'
      });
    }
    
    res.status(500).json({
      success: false,
      mensaje: 'Error al crear usuario',
      error: error.message
    });
  }
});

// ===== RUTAS PUT =====

// Actualizar un usuario
app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { nombre, email } = req.body;
    
    // Validación
    if (!nombre && !email) {
      return res.status(400).json({
        success: false,
        mensaje: 'Al menos nombre o email son requeridos'
      });
    }
    
    // Construir query dinámicamente
    let query = 'UPDATE usuarios SET ';
    let valores = [];
    let contador = 1;
    
    if (nombre) {
      query += `nombre = $${contador}`;
      valores.push(nombre);
      contador++;
    }
    
    if (email) {
      if (nombre) query += ', ';
      query += `email = $${contador}`;
      valores.push(email);
      contador++;
    }
    
    query += ` WHERE id = $${contador} RETURNING *`;
    valores.push(id);
    
    const resultado = await pool.query(query, valores);
    
    if (resultado.rows.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario no encontrado'
      });
    }
    
    res.json({
      success: true,
      mensaje: 'Usuario actualizado exitosamente',
      data: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error en PUT /api/usuarios/:id:', error);
    
    // Verificar si el email ya existe
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        mensaje: 'El email ya está registrado'
      });
    }
    
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar usuario',
      error: error.message
    });
  }
});

// ===== RUTAS DELETE =====

// Eliminar un usuario
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    const resultado = await pool.query(
      'DELETE FROM usuarios WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (resultado.rows.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario no encontrado'
      });
    }
    
    res.json({
      success: true,
      mensaje: 'Usuario eliminado exitosamente',
      data: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error en DELETE /api/usuarios/:id:', error);
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
  console.log(`✓ Base de datos: PostgreSQL`);
  console.log(`✓ Prueba: GET http://localhost:${PORT}/api/usuarios`);
});