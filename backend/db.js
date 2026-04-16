const { Pool } = require('pg');

// Configuración de conexión a PostgreSQL
const pool = new Pool({
  user: 'postgres',           // Usuario de PostgreSQL
  password: 'admin12345',       // ⚠️ CAMBIA ESTO por tu contraseña
  host: 'localhost',          // Servidor local
  port: 5432,                 // Puerto de PostgreSQL
  database: 'sistema_gestion' // Nombre de la BD
});

// Verificar conexión
pool.on('connect', () => {
  console.log('✓ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('✗ Error de conexión:', err);
});

module.exports = pool;