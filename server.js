const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/database');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const errorHandler = require('./middleware/error');

// Cargar variables de entorno
const dotenvResult = dotenv.config();

const app = express();

// Conectar a MongoDB
connectDB();

// Middlewares
app.use(helmet());
app.use(morgan('combined'));
app.use(mongoSanitize());
app.use(xss());

// Configuración de CORS
const whitelist = [
  process.env.FRONTEND_URL,
  'http://localhost:3000'
].filter(Boolean); // Filtra valores undefined/null

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin 'origin' (como apps móviles o Postman) en modo no-producción
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (whitelist.indexOf(origin) !== -1 || (process.env.NODE_ENV !== 'production' && origin && origin.includes('192.168.'))) {
      callback(null, true)
    } else {
      callback(new Error('No permitido por CORS'))
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos desde la carpeta uploads
// Esta línea ya no es necesaria si todo se sirve desde Cloudinary.
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Daniela Tattoos funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      tattoos: '/api/tattoos',
      categories: '/api/categories',
      upload: '/api/upload'
    }
  });
});

// Importar rutas
const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const tattoosRoutes = require('./routes/tattoos');
const uploadRoutes = require('./routes/upload');
const settingsRoutes = require('./routes/settings');
const stylesRoutes = require('./routes/styles');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/tattoos', tattoosRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/styles', stylesRoutes);


// Middleware de manejo de errores
app.use(errorHandler);

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

// Ruta para 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe`
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
});

module.exports = app; 