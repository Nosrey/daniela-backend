const express = require('express');
const {
  getStyles,
  getStyle,
  createStyle,
  updateStyle,
  deleteStyle,
  reorderStyles,
} = require('../controllers/styles'); 

const Style = require('../models/Style');

const router = express.Router();

const { protect, restrictTo } = require('../middleware/auth');

router
  .route('/')
  .get(getStyles)
  .post(protect, restrictTo('admin'), createStyle);

router
  .route('/:id')
  .get(getStyle)
  .put(protect, restrictTo('admin'), updateStyle)
  .delete(protect, restrictTo('admin'), deleteStyle);

router.put('/reorder', protect, restrictTo('admin'), reorderStyles);

module.exports = router; 