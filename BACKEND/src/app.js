const express = require('express');
const app = express();

// Middleware para entender JSON
app.use(express.json());

// Una ruta de prueba (Health Check)
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Servidor de Alquiler de Trajes funcionando' 
    });
});

// Configuración del puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});