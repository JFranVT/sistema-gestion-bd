const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/test', (req, res) => {
  console.log('=== DATOS RECIBIDOS ===');
  console.log('Body completo:', req.body);
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('========================');
  
  res.json({
    recibido: req.body,
    mensaje: 'Datos recibidos correctamente'
  });
});

app.listen(3001, () => {
  console.log('Servidor de prueba en http://localhost:3001/test');
});