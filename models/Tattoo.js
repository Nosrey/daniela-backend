const mongoose = require('mongoose');
const Category = require('./Category');
const Style = require('./Style');

const TattooSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título es obligatorio.'],
      trim: true,
      maxlength: [100, 'El título no puede tener más de 100 caracteres.'],
    },
    description: {
      type: String,
      required: [true, 'La descripción es obligatoria.'],
      maxlength: [1000, 'La descripción no puede tener más de 1000 caracteres.'],
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        width: { type: Number, required: true },
        height: { type: Number, required: true },
        alt: String,
      },
    ],
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'La categoría es obligatoria.'],
    },
    style: {
      type: mongoose.Schema.ObjectId,
      ref: 'Style',
      required: [true, 'El estilo es obligatorio.'],
    },
    tags: [String],
    size: {
      type: String,
      enum: ['pequeño', 'mediano', 'grande', 'extra-grande'],
      default: 'mediano',
    },
    duration: String,
    bodyPart: {
      type: String,
      enum: ['brazo', 'pierna', 'espalda', 'pecho', 'cuello', 'mano', 'pie', 'torso', 'otro'],
      default: 'otro',
    },
    isPortfolio: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    position: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware para actualizar el contador de tatuajes en la categoría
TattooSchema.statics.updateCategoryTattooCount = async function (categoryId) {
  if (!categoryId) return;
  try {
    const count = await this.model('Tattoo').countDocuments({ category: categoryId });
    await Category.findByIdAndUpdate(categoryId, { tattooCount: count });
  } catch (err) {
    console.error(`Error al actualizar el contador de tatuajes para la categoría ${categoryId}:`, err);
  }
};

// Middleware para actualizar el contador de tatuajes en el estilo
TattooSchema.statics.updateStyleTattooCount = async function (styleId) {
  if (!styleId) return;
  try {
    const count = await this.model('Tattoo').countDocuments({ style: styleId });
    await Style.findByIdAndUpdate(styleId, { tattooCount: count });
  } catch (err) {
    console.error(`Error al actualizar el contador de tatuajes para el estilo ${styleId}:`, err);
  }
};

// Hook para capturar el estado del documento ANTES de que se guarde una actualización
TattooSchema.pre('findOneAndUpdate', async function(next) {
  this.originalDoc = await this.model.findOne(this.getQuery());
  next();
});

// Hook DESPUÉS de que se guarde una actualización
TattooSchema.post('findOneAndUpdate', async function(doc) {
  if (this.originalDoc) {
    // Actualizar contador para categoría anterior si cambió
    if (this.originalDoc.category.toString() !== doc.category.toString()) {
      await doc.constructor.updateCategoryTattooCount(this.originalDoc.category);
    }
    // Actualizar contador para estilo anterior si cambió
    if (this.originalDoc.style.toString() !== doc.style.toString()) {
      await doc.constructor.updateStyleTattooCount(this.originalDoc.style);
    }
  }
  // Actualizar contadores para la nueva categoría y estilo
  await doc.constructor.updateCategoryTattooCount(doc.category);
  await doc.constructor.updateStyleTattooCount(doc.style);
});


// Después de guardar un tatuaje nuevo
TattooSchema.post('save', async function () {
  await this.constructor.updateCategoryTattooCount(this.category);
  await this.constructor.updateStyleTattooCount(this.style);
});

// Antes de eliminar un tatuaje
TattooSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  await this.constructor.updateCategoryTattooCount(this.category);
  await this.constructor.updateStyleTattooCount(this.style);
  next();
});

module.exports = mongoose.model('Tattoo', TattooSchema); 