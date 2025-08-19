const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configuración de Cloudinary
const cloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
                             process.env.CLOUDINARY_API_KEY &&
                             process.env.CLOUDINARY_API_SECRET;

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} else {
    console.warn('Cloudinary no está configurado. Las subidas de archivos fallarán.');
}

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

const uploadToCloudinary = (buffer, options = {}) => {
  if (!cloudinaryConfigured) {
    return Promise.reject(new Error('Cloudinary no está configurado. No se puede subir el archivo.'));
  }
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({
      resource_type: 'auto',
      folder: 'daniela-tattoos',
      transformation: [{ width: 1200, height: 1200, crop: 'limit' }, { quality: 'auto' }, { fetch_format: 'auto' }],
      ...options
    }, (error, result) => {
      if (error) {
        console.error("Error al subir a Cloudinary:", error);
        return reject(error);
      }
      resolve({
        secure_url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      });
    }).end(buffer);
  });
};

const handleUpload = async (buffer, originalName, options = {}) => {
  // Siempre usa Cloudinary, arrojará un error si no está configurado.
  return await uploadToCloudinary(buffer, options);
};

const deleteFromCloudinary = async (publicId) => {
  if (!cloudinaryConfigured) {
    return Promise.reject(new Error('Cloudinary no está configurado. No se puede eliminar el archivo.'));
  }
  if (!publicId) {
    return Promise.resolve({ result: 'ok', message: 'No public_id provided' });
  }
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error(`Error eliminando de Cloudinary (public_id: ${publicId}):`, error);
        return reject(error);
      }
      resolve(result);
    });
  });
};

module.exports = {
  upload,
  handleUpload,
  deleteFromCloudinary,
}; 