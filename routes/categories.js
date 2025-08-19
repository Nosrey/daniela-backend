const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { protect, restrictTo } = require('../middleware/auth');
const { deleteFromCloudinary } = require('../middleware/upload');

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

const router = express.Router();

// @desc    Obtener todas las categorías
// @route   GET /api/categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.getWithCounts();
    
    res.json({
      status: 'success',
      results: categories.length,
      data: {
        categories
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error obteniendo categorías',
      error: error.message
    });
  }
});

// @desc    Obtener una categoría por ID o slug
// @route   GET /api/categories/:identifier
// @access  Public
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Buscar por ID o slug
    const category = await Category.findOne({
      $or: [
        { _id: identifier },
        { slug: identifier }
      ],
      isActive: true
    });
    
    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Categoría no encontrada'
      });
    }

    res.json({
      status: 'success',
      data: {
        category
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error obteniendo categoría',
      error: error.message
    });
  }
});

// @desc    Crear nueva categoría
// @route   POST /api/categories
// @access  Private/Admin
router.post('/', protect, restrictTo('admin'), [
  body('name').trim().notEmpty().withMessage('El nombre es requerido').isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('La descripción no puede tener más de 200 caracteres'),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color debe ser en formato hexadecimal'),
  body('icon').optional().isString().withMessage('Ícono debe ser una cadena de texto'),
  body('position').optional().isInt({ min: 0 }).withMessage('Posición debe ser un número positivo'),
  body('image.url').optional().isURL().withMessage('URL de imagen no válida'),
  body('image.publicId').optional().isString().withMessage('Public ID de imagen requerido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    console.log('Attempting to create category with body:', JSON.stringify(req.body, null, 2));
    
    // Manually generate slug from name
    const newCategory = new Category({
      ...req.body,
      slug: generateSlug(req.body.name)
    });
    
    const category = await newCategory.save();

    res.status(201).json({
      status: 'success',
      data: {
        category
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Ya existe una categoría con ese nombre'
      });
    }
    
    console.error('Error creating category:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error creando categoría',
      error: error.message
    });
  }
});

// @desc    Actualizar categoría
// @route   PUT /api/categories/:id
// @access  Private/Admin
router.put('/:id', protect, restrictTo('admin'), [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('La descripción no puede tener más de 200 caracteres'),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color debe ser en formato hexadecimal'),
  body('icon').optional().isString().withMessage('Ícono debe ser una cadena de texto'),
  body('position').optional().isInt({ min: 0 }).withMessage('Posición debe ser un número positivo'),
  body('isActive').optional().isBoolean().withMessage('isActive debe ser true o false'),
  body('image.url').optional().isURL().withMessage('URL de imagen no válida'),
  body('image.publicId').optional().isString().withMessage('Public ID de imagen requerido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const oldCategory = await Category.findById(req.params.id);
    if (!oldCategory) {
      return res.status(404).json({ status: 'error', message: 'Categoría no encontrada' });
    }

    const { image, ...otherUpdates } = req.body;
    const updateOperation = { $set: otherUpdates };
    
    // Generate slug if name is being updated
    if (req.body.name && req.body.name !== oldCategory.name) {
      updateOperation.$set.slug = generateSlug(req.body.name);
    }

    // Case 1: A new image is provided
    if (image && image.url) {
      updateOperation.$set.image = image;
      // If the new image is different from the old one, delete the old one
      if (oldCategory.image?.publicId && oldCategory.image.publicId !== image.publicId) {
        try {
          await deleteFromCloudinary(oldCategory.image.publicId);
        } catch (err) {
          console.error("Failed to delete old image from Cloudinary", err);
    }
      }
    } 
    // Case 2: No image is provided in the payload, meaning it should be removed
    else {
      updateOperation.$unset = { image: "" };
      // If an old image existed, delete it from Cloudinary
      if (oldCategory.image?.publicId) {
        try {
          await deleteFromCloudinary(oldCategory.image.publicId);
        } catch (err) {
          console.error("Failed to delete old image from Cloudinary", err);
        }
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      updateOperation,
      { new: true, runValidators: true }
    );

    res.json({
      status: 'success',
      data: {
        category: updatedCategory
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Ya existe una categoría con ese nombre'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Error actualizando categoría',
      error: error.message
    });
  }
});

// @desc    Eliminar categoría
// @route   DELETE /api/categories/:id
// @access  Private/Admin
router.delete('/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Categoría no encontrada'
      });
    }

    // Verificar si tiene tatuajes asociados
    if (category.tattooCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No se puede eliminar una categoría que tiene tatuajes asociados'
      });
    }

    await category.deleteOne();

    res.json({
      status: 'success',
      message: 'Categoría eliminada correctamente'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error eliminando categoría',
      error: error.message
    });
  }
});

// @desc    Actualizar posiciones de las categorías
// @route   PUT /api/categories/reorder
// @access  Private/Admin
router.put('/reorder', protect, restrictTo('admin'), [
  body('categories').isArray().withMessage('Debe ser un array de categorías'),
  body('categories.*.id').isMongoId().withMessage('ID de categoría no válido'),
  body('categories.*.position').isInt({ min: 0 }).withMessage('Posición debe ser un número positivo')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const { categories } = req.body;

    // Actualizar posiciones
    const updatePromises = categories.map(cat => 
      Category.findByIdAndUpdate(cat.id, { position: cat.position })
    );

    await Promise.all(updatePromises);

    res.json({
      status: 'success',
      message: 'Posiciones actualizadas correctamente'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error actualizando posiciones',
      error: error.message
    });
  }
});

module.exports = router; 