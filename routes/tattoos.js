const express = require('express');
const {
  getTattoos,
  getTattoo,
  createTattoo,
  updateTattoo,
  deleteTattoo,
  getTattooStats,
} = require('../controllers/tattoos');

const Tattoo = require('../models/Tattoo');
const advancedResults = require('../middleware/advancedResults');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Rutas públicas
router.get(
  '/',
  advancedResults(Tattoo, [
    { path: 'category', select: 'name slug' },
    { path: 'style', select: 'name slug' }
  ]),
  getTattoos
);
router.get('/stats', protect, restrictTo('admin'), getTattooStats);
router.route('/:id').get(getTattoo);


// Rutas privadas para administradores
router.use(protect, restrictTo('admin'));

router.route('/')
  .post(createTattoo);
  
router.route('/:id')
  .put(updateTattoo)
  .delete(deleteTattoo);

module.exports = router; 