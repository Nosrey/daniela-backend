const mongoose = require('mongoose');
const slugify = require('slugify');

const StyleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del estilo es obligatorio.'],
      unique: true,
      trim: true,
      maxlength: [50, 'El nombre del estilo no puede tener más de 50 caracteres.'],
    },
    slug: String,
    description: {
      type: String,
      maxlength: [500, 'La descripción no puede tener más de 500 caracteres.'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    position: {
      type: Number,
      default: 0,
    },
    tattooCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Middleware para crear el slug a partir del nombre
StyleSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true, strict: true });
  next();
});

// Middleware para actualizar el contador de tatuajes en el estilo
StyleSchema.statics.updateTattooCount = async function (styleId) {
  try {
    const count = await this.model('Tattoo').countDocuments({ style: styleId });
    await this.findByIdAndUpdate(styleId, {
      tattooCount: count,
    });
  } catch (err) {
    console.error(`Error al actualizar el contador de tatuajes para el estilo ${styleId}:`, err);
  }
};

module.exports = mongoose.model('Style', StyleSchema); 