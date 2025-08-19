const mongoose = require('mongoose');

const HeroSettingsSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ['latest_featured', 'latest_tattoo', 'most_popular', 'specific_tattoo', 'custom_image'],
    default: 'latest_featured',
  },
  specificTattooId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tattoo',
    default: null,
  },
  customImageUrl: {
    type: String,
    default: '',
  },
  customImagePublicId: {
    type: String,
    default: '',
  },
  backgroundSize: {
    type: String,
    enum: ['cover', 'contain', 'auto'],
    default: 'cover',
  },
  backgroundPosition: {
    type: String,
    default: 'center center',
  },
  overlayOpacity: {
    type: Number,
    default: 0.6,
    min: 0,
    max: 1,
  },
  title: {
    type: String,
    default: 'Daniela Tattoos',
    trim: true,
  },
  subtitle: {
    type: String,
    default: 'Arte en tu piel. Historias que perduran para siempre.',
    trim: true,
  },
});

const AboutSettingsSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Arte que Cuenta Historias',
    trim: true,
  },
  paragraph1: {
    type: String,
    default: 'Con más de 10 años de experiencia...',
    trim: true,
  },
  paragraph2: {
    type: String,
    default: 'Mi compromiso es brindarte una experiencia excepcional...',
    trim: true,
  },
  stat1_value: { type: String, default: '500+' },
  stat1_label: { type: String, default: 'Tatuajes' },
  stat2_value: { type: String, default: '10+' },
  stat2_label: { type: String, default: 'Años' },
  stat3_value: { type: String, default: '100%' },
  stat3_label: { type: String, default: 'Satisfacción' },
  imageUrl: {
    type: String,
    default: '/daniela.jpg', // Default a la imagen local
  },
  imagePublicId: {
    type: String,
    default: '',
  },
  experienceYear: {
    type: Number,
    default: 2014,
  },
});

const FooterSettingsSchema = new mongoose.Schema({
  contactTitle: {
    type: String,
    default: 'Hagamos Realidad tu Tatuaje',
    trim: true,
  },
  contactSubtitle: {
    type: String,
    default: '¿Tienes una idea en mente? Hablemos sobre tu próximo tatuaje y creemos algo único juntos.',
    trim: true,
  },
  title: {
    type: String,
    default: 'Daniela Tattoos',
    trim: true,
  },
  tagline: {
    type: String,
    default: 'Arte que perdura para siempre',
    trim: true,
  },
  address: {
    type: String,
    default: 'Calle Principal 123, Ciudad',
    trim: true,
  },
  phone: {
    type: String,
    default: '+1 234 567 890',
    trim: true,
  },
  email: {
    type: String,
    default: 'contacto@danielatattoos.com',
    trim: true,
  },
  instagram: {
    type: String,
    default: 'https://instagram.com/danielatattoos',
    trim: true,
  },
  whatsapp: {
    type: String,
    default: 'https://wa.me/1234567890',
    trim: true,
  },
  facebook: {
    type: String,
    default: '',
    trim: true,
  },
  twitter: {
    type: String,
    default: '',
    trim: true,
  },
  copyright: {
    type: String,
    default: 'Todos los derechos reservados',
    trim: true,
  },
});

const SettingsSchema = new mongoose.Schema({
  // Usamos un ID único y predecible para que siempre haya un solo documento de configuración
  singleton: {
    type: String,
    default: 'main_settings',
    unique: true,
  },
  hero: {
    type: HeroSettingsSchema,
    default: () => ({}),
  },
  about: {
    type: AboutSettingsSchema,
    default: () => ({}),
  },
  footer: {
    type: FooterSettingsSchema,
    default: () => ({}),
  },
}, {
  timestamps: true,
});

// Método para obtener o crear la configuración
SettingsSchema.statics.getSingleton = async function() {
  const settings = await this.findOne({ singleton: 'main_settings' });
  if (settings) {
    return settings;
  }
  return this.create({ singleton: 'main_settings' });
};

module.exports = mongoose.model('Settings', SettingsSchema); 