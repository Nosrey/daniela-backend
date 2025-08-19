const Style = require('../models/Style');
const Tattoo = require('../models/Tattoo');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Obtener todos los estilos
// @route   GET /api/styles
// @access  Public
exports.getStyles = asyncHandler(async (req, res, next) => {
  const styles = await Style.find(req.query).sort({ position: 1 });
  res.status(200).json({
    status: 'success',
    count: styles.length,
    data: styles,
  });
});

// @desc    Obtener un solo estilo
// @route   GET /api/styles/:id
// @access  Public
exports.getStyle = asyncHandler(async (req, res, next) => {
  const style = await Style.findById(req.params.id);
  if (!style) {
    return next(
      new ErrorResponse(`Estilo no encontrado con ID ${req.params.id}`, 404)
    );
  }
  res.status(200).json({ status: 'success', data: style });
});

// @desc    Crear un nuevo estilo
// @route   POST /api/styles
// @access  Private/Admin
exports.createStyle = asyncHandler(async (req, res, next) => {
  const style = await Style.create(req.body);
  res.status(201).json({
    status: 'success',
    data: style,
  });
});

// @desc    Actualizar un estilo
// @route   PUT /api/styles/:id
// @access  Private/Admin
exports.updateStyle = asyncHandler(async (req, res, next) => {
  const style = await Style.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!style) {
    return next(
      new ErrorResponse(`Estilo no encontrado con ID ${req.params.id}`, 404)
    );
  }
  res.status(200).json({ status: 'success', data: style });
});

// @desc    Eliminar un estilo
// @route   DELETE /api/styles/:id
// @access  Private/Admin
exports.deleteStyle = asyncHandler(async (req, res, next) => {
  const style = await Style.findById(req.params.id);
  if (!style) {
    return next(
      new ErrorResponse(`Estilo no encontrado con ID ${req.params.id}`, 404)
    );
  }
  
  // Opcional: verificar si hay tatuajes con este estilo antes de borrar
  const tattoosWithStyle = await Tattoo.countDocuments({ style: req.params.id });
  if (tattoosWithStyle > 0) {
    return next(
      new ErrorResponse(
        `No se puede eliminar el estilo porque ${tattoosWithStyle} tatuajes dependen de él.`,
        400
      )
    );
  }

  await style.deleteOne();
  res.status(200).json({ status: 'success', data: {} });
});

// @desc    Reordenar estilos
// @route   PUT /api/styles/reorder
// @access  Private/Admin
exports.reorderStyles = asyncHandler(async (req, res, next) => {
  const { styles } = req.body; // Se espera un array de { id: styleId, position: newPosition }
  if (!styles || !Array.isArray(styles)) {
    return next(new ErrorResponse('Se requiere un array de estilos para reordenar.', 400));
  }

  const bulkOps = styles.map(style => ({
    updateOne: {
      filter: { _id: style.id },
      update: { $set: { position: style.position } },
    },
  }));

  await Style.bulkWrite(bulkOps);

  res.status(200).json({
    status: 'success',
    message: 'Estilos reordenados correctamente.',
  });
}); 