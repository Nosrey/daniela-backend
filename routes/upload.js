const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const { upload, handleUpload, deleteFromCloudinary } = require('../middleware/upload');

const router = express.Router();

// @desc    Subir una o varias imágenes para tatuajes
// @route   POST /api/upload/
// @access  Private/Admin
router.post(
  '/',
  protect,
  restrictTo('admin'),
  upload.array('images', 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ status: 'error', message: 'No se han seleccionado imágenes.' });
      }

      const uploadPromises = req.files.map(file => 
        handleUpload(file.buffer, file.originalname)
      );
      
      const results = await Promise.all(uploadPromises);

      const images = results.map(result => ({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      }));

      res.status(201).json({ status: 'success', data: { images } });

    } catch (error) {
      console.error('Error subiendo imágenes:', error);
      res.status(500).json({ status: 'error', message: 'Error subiendo imágenes.', error: error.message });
    }
  }
);


// @desc    Eliminar una imagen de Cloudinary
// @route   DELETE /api/upload/:publicId
// @access  Private/Admin
router.delete(
    '/:publicId(*)', // Usa (*) para capturar public_ids que contienen slashes
    protect, 
    restrictTo('admin'), 
    async (req, res) => {
        try {
            const { publicId } = req.params;
            if (!publicId) {
                return res.status(400).json({ status: 'error', message: 'Se requiere el public_id de la imagen.' });
            }

            const result = await deleteFromCloudinary(publicId);

            res.status(200).json({ status: 'success', message: 'Imagen eliminada correctamente.', data: result });

        } catch (error) {
            console.error(`Error eliminando imagen ${req.params.publicId}:`, error);
            res.status(500).json({ status: 'error', message: 'Error al eliminar la imagen.', error: error.message });
        }
    }
);

module.exports = router; 