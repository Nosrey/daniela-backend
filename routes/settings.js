const express = require('express');
const Settings = require('../models/Settings');
const { protect, restrictTo } = require('../middleware/auth');
const { upload, handleUpload, deleteFromCloudinary } = require('../middleware/upload');

const router = express.Router();

// @desc    Obtener la configuración
// @route   GET /api/settings
// @access  Public
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.getSingleton();
    res.json({
      status: 'success',
      data: { settings },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error obteniendo la configuración', error: error.message });
  }
});

// @desc    Actualizar la configuración (texto e imágenes)
// @route   PUT /api/settings
// @access  Private/Admin
router.put(
  '/',
  protect,
  restrictTo('admin'),
  upload.fields([
    { name: 'heroImage', maxCount: 1 },
    { name: 'aboutImage', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const settings = await Settings.getSingleton();
      
      // Los datos de texto vienen como JSON en un campo 'settings'
      const textData = JSON.parse(req.body.settings || '{}');

      if (textData.hero) {
        Object.assign(settings.hero, textData.hero);
      }
      if (textData.about) {
        Object.assign(settings.about, textData.about);
      }
      if (textData.footer) {
        Object.assign(settings.footer, textData.footer);
        settings.markModified('footer');
      }

      // Manejar subida de imagen del Hero
      if (req.files && req.files.heroImage) {
        const file = req.files.heroImage[0];
        // Eliminar imagen antigua si existe
        if (settings.hero.customImagePublicId) {
          await deleteFromCloudinary(settings.hero.customImagePublicId);
        }
        const result = await handleUpload(file.buffer, file.originalname, {
          folder: 'daniela-tattoos/settings'
        });
        settings.hero.customImageUrl = result.secure_url;
        settings.hero.customImagePublicId = result.public_id;
      }

      // Manejar subida de imagen de "About"
      if (req.files && req.files.aboutImage) {
        const file = req.files.aboutImage[0];
        // Eliminar imagen antigua si existe
        if (settings.about.imagePublicId) {
          await deleteFromCloudinary(settings.about.imagePublicId);
        }
        const result = await handleUpload(file.buffer, file.originalname, {
          folder: 'daniela-tattoos/settings'
        });
        settings.about.imageUrl = result.secure_url;
        settings.about.imagePublicId = result.public_id;
      }
      
      await settings.save();
      
      res.json({
        status: 'success',
        data: { settings },
      });
    } catch (error) {
      console.error('--- ERROR AL ACTUALIZAR SETTINGS ---', error);
      res.status(500).json({ status: 'error', message: 'Error actualizando la configuración', error: error.message });
    }
  }
);

module.exports = router; 