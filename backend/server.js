// Importar módulos
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const authRoutes = require('./auth');

require('dotenv').config();

// Crear app
const app = express();
const PORT = process.env.PORT || 3001;
const ORIGENES_PERMITIDOS = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origen) => origen.trim())
  .filter(Boolean);

// ⭐ MIDDLEWARES
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ORIGENES_PERMITIDOS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origen no permitido por CORS'));
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== RUTAS DE AUTENTICACIÓN =====
app.use('/api/auth', authRoutes);

// ===== RUTAS DE USUARIOS (sin cambios) =====

app.get('/', (req, res) => {
  res.json({ 
    mensaje: '¡Bienvenido!',
    version: '3.0.0',
    autenticacion: 'con 2FA'
  });
});

app.get('/api/usuarios', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT id, nombre, email FROM usuarios ORDER BY id');
    
    res.json({
      success: true,
      data: resultado.rows,
      cantidad: resultado.rows.length
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener usuarios'
    });
  }
});

app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const resultado = await pool.query('SELECT id, nombre, email FROM usuarios WHERE id = $1', [id]);
    
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
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener usuario'
    });
  }
});

app.post('/api/usuarios', async (req, res) => {
  try {
    const { nombre, email } = req.body;
    
    if (!nombre || !email) {
      return res.status(400).json({
        success: false,
        mensaje: 'Nombre y email son requeridos'
      });
    }
    
    // Contraseña temporal
    const contraseñaTemp = Math.random().toString(36).slice(2, 10);
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const contraseñaHash = await bcrypt.hash(contraseñaTemp, salt);
    
    const resultado = await pool.query(
      'INSERT INTO usuarios (nombre, email, contrasenia) VALUES ($1, $2, $3) RETURNING id, nombre, email',
      [nombre, email, contraseñaHash]
    );
    
    res.status(201).json({
      success: true,
      mensaje: 'Usuario creado',
      contraseña_temporal: contraseñaTemp,
      data: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error:', error);
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        mensaje: 'El email ya existe'
      });
    }
    res.status(500).json({
      success: false,
      mensaje: 'Error al crear usuario'
    });
  }
});

app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { nombre, email } = req.body;
    
    if (!nombre && !email) {
      return res.status(400).json({
        success: false,
        mensaje: 'Al menos un campo es requerido'
      });
    }
    
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
    
    query += ` WHERE id = $${contador} RETURNING id, nombre, email`;
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
      mensaje: 'Usuario actualizado',
      data: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar'
    });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    const resultado = await pool.query(
      'DELETE FROM usuarios WHERE id = $1 RETURNING id, nombre, email',
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
      mensaje: 'Usuario eliminado',
      data: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al eliminar'
    });
  }
});

// ===== ERROR 404 =====
app.use((req, res) => {
  res.status(404).json({
    success: false,
    mensaje: 'Ruta no encontrada'
  });
});

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
  console.log(`✓ Servidor en http://localhost:${PORT}`);
  console.log(`✓ Base de datos: PostgreSQL`);
});