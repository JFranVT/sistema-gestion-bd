const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const pool = require('./db');

require('dotenv').config();

// ===== REGISTRO =====
router.post('/registro', async (req, res) => {
  try {
    const { nombre, email, contrasenia, confirmarContrasenia } = req.body;

    // Validaciones
    if (!nombre || !email || !contrasenia || !confirmarContrasenia) {
      return res.status(400).json({
        success: false,
        mensaje: 'Todos los campos son requeridos'
      });
    }

    if (contrasenia !== confirmarContrasenia) {
      return res.status(400).json({
        success: false,
        mensaje: 'Las contraseñas no coinciden'
      });
    }

    if (contrasenia.length < 6) {
      return res.status(400).json({
        success: false,
        mensaje: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar si el email ya existe
    const usuarioExistente = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (usuarioExistente.rows.length > 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'El email ya está registrado'
      });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const contraseniaHash = await bcrypt.hash(contrasenia, salt);

    // Generar secreto 2FA
    const secret = speakeasy.generateSecret({
      name: `Sistema Gestión (${email})`,
      issuer: 'Sistema Gestión',
      length: 32
    });

    // Generar QR
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Insertar nuevo usuario CON 2FA habilitado
    const resultado = await pool.query(
      'INSERT INTO usuarios (nombre, email, contrasenia, dos_fa_secret, dos_fa_habilitado) VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre, email',
      [nombre, email, contraseniaHash, secret.base32, true]
    );

    res.status(201).json({
      success: true,
      mensaje: 'Usuario registrado. Verifica 2FA',
      es_registro: true,
      usuario_id: resultado.rows[0].id,
      email: resultado.rows[0].email,
      qr: qrCode,
      secret: secret.base32
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al registrar usuario',
      error: error.message
    });
  }
});

// ===== LOGIN =====
router.post('/login', async (req, res) => {
  try {
    const { email, contrasenia } = req.body;

    if (!email || !contrasenia) {
      return res.status(400).json({
        success: false,
        mensaje: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario
    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        success: false,
        mensaje: 'Email o contraseña incorrectos'
      });
    }

    const usuario = resultado.rows[0];

    // Verificar contraseña
    const contraseniaValida = await bcrypt.compare(contrasenia, usuario.contrasenia);

    if (!contraseniaValida) {
      return res.status(401).json({
        success: false,
        mensaje: 'Email o contraseña incorrectos'
      });
    }

    // Si 2FA está habilitado, pedir código (SIN generar nuevo QR)
    if (usuario.dos_fa_habilitado) {
      return res.json({
        success: true,
        mensaje: 'Ingresa el código 2FA',
        dos_fa_requerido: true,
        usuario_id: usuario.id,
        email: usuario.email,
        es_registro: false  // ← IMPORTANTE: indicar que NO es registro
      });
    }

    // Si 2FA no está habilitado, generar JWT directamente
    const token = jwt.sign(
      { usuario_id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error en login',
      error: error.message
    });
  }
});

// ===== GENERAR 2FA =====
router.post('/generar-2fa', async (req, res) => {
  try {
    const { usuario_id } = req.body;

    if (!usuario_id) {
      return res.status(400).json({
        success: false,
        mensaje: 'usuario_id es requerido'
      });
    }

    // Generar secreto
    const secret = speakeasy.generateSecret({
      name: `Sistema Gestión (${usuario_id})`,
      issuer: 'Sistema Gestión',
      length: 32
    });

    // Generar QR
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Guardar secreto (sin verificar aún)
    await pool.query(
      'UPDATE usuarios SET dos_fa_secret = $1, dos_fa_habilitado = true WHERE id = $2',
      [secret.base32, usuario_id]
    );

    res.json({
      success: true,
      mensaje: 'Código 2FA generado',
      qr: qrCode,
      secret: secret.base32
    });
  } catch (error) {
    console.error('Error generando 2FA:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al generar 2FA',
      error: error.message
    });
  }
});

// ===== VERIFICAR 2FA =====
router.post('/verificar-2fa', async (req, res) => {
  try {
    const { usuario_id, codigo } = req.body;

    if (!usuario_id || !codigo) {
      return res.status(400).json({
        success: false,
        mensaje: 'usuario_id y código son requeridos'
      });
    }

    // Obtener usuario
    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE id = $1',
      [usuario_id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    const usuario = resultado.rows[0];

    // Verificar código
    const esValido = speakeasy.totp.verify({
      secret: usuario.dos_fa_secret,
      encoding: 'base32',
      token: codigo,
      window: 2 // Permite 30 segundos de margen
    });

    if (!esValido) {
      return res.status(401).json({
        success: false,
        mensaje: 'Código 2FA incorrecto'
      });
    }

    // Marcar 2FA como verificado
    await pool.query(
      'UPDATE usuarios SET dos_fa_verificado = true WHERE id = $1',
      [usuario_id]
    );

    // Generar JWT
    const token = jwt.sign(
      { usuario_id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      mensaje: '2FA verificado correctamente',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email
      }
    });
  } catch (error) {
    console.error('Error verificando 2FA:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al verificar 2FA',
      error: error.message
    });
  }
});

// ===== OBTENER PERFIL (protegido) =====
router.get('/perfil', async (req, res) => {
  try {
    // Obtener token del header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        mensaje: 'Token no proporcionado'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Obtener usuario
    const resultado = await pool.query(
      'SELECT id, nombre, email, dos_fa_habilitado FROM usuarios WHERE id = $1',
      [decoded.usuario_id]
    );

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
    console.error('Error obteniendo perfil:', error);
    res.status(401).json({
      success: false,
      mensaje: 'Token inválido o expirado'
    });
  }
});

// ===== LOGOUT =====
router.post('/logout', async (req, res) => {
  try {
    res.json({
      success: true,
      mensaje: 'Logout exitoso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error en logout'
    });
  }
});

module.exports = router;