const mongoose = require('mongoose');

// Simple function to generate a slug from a string
function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/&/g, '-and-')      // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')    // Remove all non-word characters
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre de la categoría es requerido'],
    trim: true,
    unique: true,
    maxLength: [50, 'El nombre no puede tener más de 50 caracteres']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxLength: [200, 'La descripción no puede tener más de 200 caracteres']
  },
  color: {
    type: String,
    default: '#6B7280',
    match: [/^#[0-9A-F]{6}$/i, 'Color debe ser en formato hexadecimal']
  },
  icon: {
    type: String,
    default: ''
  },
  image: {
    url: {
      type: String,
      default: ''
    },
    publicId: {
      type: String,
      default: ''
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  position: {
    type: Number,
    default: 0
  },
  tattooCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Índices
categorySchema.index({ isActive: 1, position: 1 });

// Middleware para generar slug automáticamente
categorySchema.pre('save', function(next) {
  if (this.isNew || this.isModified('name')) {
    this.slug = generateSlug(this.name);
  }
  next();
});

// Método para actualizar contador de tatuajes
categorySchema.methods.updateTattooCount = async function() {
  const Tattoo = mongoose.model('Tattoo');
  const count = await Tattoo.countDocuments({ 
    category: this._id, 
    isPublished: true 
  });
  this.tattooCount = count;
  return this.save();
};

// Método estático para obtener categorías con contador
categorySchema.statics.getWithCounts = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'tattoos',
        localField: '_id',
        foreignField: 'category',
        as: 'tattoos'
      }
    },
    {
      $addFields: {
        tattooCount: {
          $size: {
            $filter: {
              input: '$tattoos',
              cond: { $eq: ['$$this.isPublished', true] }
            }
          }
        }
      }
    },
    {
      $project: {
        tattoos: 0
      }
    },
    { $sort: { position: 1, name: 1 } }
  ]);
};

module.exports = mongoose.model('Category', categorySchema); 