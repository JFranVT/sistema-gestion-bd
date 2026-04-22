const { Pool } = require('pg');
require('dotenv').config();

// Configuración de conexión a PostgreSQL desde .env
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME
});

// Verificar conexión
pool.on('connect', () => {
  console.log('✓ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('✗ Error de conexión:', err);
});

module.exports = pool;