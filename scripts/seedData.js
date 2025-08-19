const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');
const Category = require('../models/Category');
const Tattoo = require('../models/Tattoo');

// Cargar variables de entorno
dotenv.config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/daniela-tattoos', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Datos de ejemplo
const users = [
  {
    name: 'Daniela Admin',
    email: 'admin@danielatattoos.com',
    password: 'admin123',
    role: 'admin',
    bio: 'Artista de tatuajes profesional con más de 10 años de experiencia',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=300&h=300&fit=crop&crop=face'
  }
];

const categories = [
  {
    name: 'Realista',
    slug: 'realista',
    description: 'Tatuajes con estilo realista, capturando detalles increíbles',
    color: '#FF6B6B',
    icon: '🎨',
    position: 1
  },
  {
    name: 'Tradicional',
    slug: 'tradicional',
    description: 'Tatuajes de estilo tradicional americano',
    color: '#4ECDC4',
    icon: '⚓',
    position: 2
  },
  {
    name: 'Geométrico',
    slug: 'geometrico',
    description: 'Diseños geométricos y patrones abstractos',
    color: '#45B7D1',
    icon: '🔷',
    position: 3
  },
  {
    name: 'Minimalista',
    slug: 'minimalista',
    description: 'Tatuajes pequeños y delicados con líneas simples',
    color: '#96CEB4',
    icon: '✨',
    position: 4
  },
  {
    name: 'Blackwork',
    slug: 'blackwork',
    description: 'Tatuajes en tinta negra con contrastes fuertes',
    color: '#2C3E50',
    icon: '⚫',
    position: 5
  },
  {
    name: 'Color',
    slug: 'color',
    description: 'Tatuajes vibrantes llenos de color',
    color: '#E74C3C',
    icon: '🌈',
    position: 6
  }
];

const sampleTattoos = [
  {
    title: 'Rosa Realista',
    description: 'Hermosa rosa realista en tonos rojos y verdes, perfecta para el antebrazo',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1565058379802-bbe93b2f8f9a?w=800&h=600&fit=crop',
        publicId: 'sample_rose_1',
        alt: 'Rosa realista'
      }
    ],
    tags: ['rosa', 'realista', 'flor', 'femenino'],
    style: 'realista',
    size: 'mediano',
    bodyPart: 'brazo',
    duration: '4-5 horas',
    isFeatured: true,
    isPublished: true,
    position: 1
  },
  {
    title: 'Ancla Tradicional',
    description: 'Clásica ancla de estilo tradicional americano con banner',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=800&h=600&fit=crop',
        publicId: 'sample_anchor_1',
        alt: 'Ancla tradicional'
      }
    ],
    tags: ['ancla', 'tradicional', 'nautico', 'clasico'],
    style: 'tradicional',
    size: 'mediano',
    bodyPart: 'brazo',
    duration: '3-4 horas',
    isFeatured: true,
    isPublished: true,
    position: 2
  },
  {
    title: 'Mandala Geométrico',
    description: 'Intrincado diseño de mandala con patrones geométricos simétricos',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
        publicId: 'sample_mandala_1',
        alt: 'Mandala geométrico'
      }
    ],
    tags: ['mandala', 'geometrico', 'simetrico', 'espiritual'],
    style: 'geometrico',
    size: 'grande',
    bodyPart: 'espalda',
    duration: '6-8 horas',
    isFeatured: true,
    isPublished: true,
    position: 3
  },
  {
    title: 'Línea Minimalista',
    description: 'Diseño minimalista de líneas simples y elegantes',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1549317336-206569e8475c?w=800&h=600&fit=crop',
        publicId: 'sample_minimal_1',
        alt: 'Línea minimalista'
      }
    ],
    tags: ['minimalista', 'linea', 'simple', 'elegante'],
    style: 'minimalista',
    size: 'pequeño',
    bodyPart: 'mano',
    duration: '1-2 horas',
    isFeatured: false,
    isPublished: true,
    position: 4
  },
  {
    title: 'Blackwork Abstract',
    description: 'Diseño abstracto en tinta negra con formas orgánicas',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800&h=600&fit=crop',
        publicId: 'sample_blackwork_1',
        alt: 'Blackwork abstracto'
      }
    ],
    tags: ['blackwork', 'abstracto', 'organico', 'bold'],
    style: 'blackwork',
    size: 'grande',
    bodyPart: 'pierna',
    duration: '5-6 horas',
    isFeatured: false,
    isPublished: true,
    position: 5
  },
  {
    title: 'Mariposa Colorida',
    description: 'Vibrante mariposa con colores azules y púrpuras',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
        publicId: 'sample_butterfly_1',
        alt: 'Mariposa colorida'
      }
    ],
    tags: ['mariposa', 'color', 'vibrante', 'azul', 'purpura'],
    style: 'color',
    size: 'mediano',
    bodyPart: 'torso',
    duration: '4-5 horas',
    isFeatured: true,
    isPublished: true,
    position: 6
  }
];

const seedData = async () => {
  try {
    // Limpiar datos existentes
    await User.deleteMany({});
    await Category.deleteMany({});
    await Tattoo.deleteMany({});

    console.log('📦 Datos anteriores eliminados');

    // Crear usuarios
    const createdUsers = await User.create(users);
    console.log(`👤 ${createdUsers.length} usuarios creados`);

    // Crear categorías
    const createdCategories = await Category.create(categories);
    console.log(`📂 ${createdCategories.length} categorías creadas`);

    // Crear tatuajes asignando categorías y usuario
    const tattoosWithRefs = sampleTattoos.map((tattoo, index) => ({
      ...tattoo,
      category: createdCategories[index % createdCategories.length]._id,
      createdBy: createdUsers[0]._id
    }));

    const createdTattoos = await Tattoo.create(tattoosWithRefs);
    console.log(`🎨 ${createdTattoos.length} tatuajes creados`);

    // Actualizar contadores de categorías
    for (const category of createdCategories) {
      await category.updateTattooCount();
    }
    console.log('🔄 Contadores de categorías actualizados');

    console.log('\n✅ Datos de prueba creados exitosamente!');
    console.log('\n📋 Credenciales de administrador:');
    console.log('📧 Email: admin@danielatattoos.com');
    console.log('🔐 Contraseña: admin123');
    console.log('\n🌐 Puedes probar la API en: http://localhost:5000');
    
  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Ejecutar si el script se llama directamente
if (require.main === module) {
  seedData();
}

module.exports = seedData; 