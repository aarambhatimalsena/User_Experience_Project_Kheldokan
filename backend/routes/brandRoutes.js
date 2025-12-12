import express from 'express';
import {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
} from '../controllers/brandController.js';

import { protect, adminOnly } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public
router.get('/', getAllBrands);
router.get('/:id', getBrandById);

// Admin
router.post('/', protect, adminOnly, upload.single('logo'), createBrand);
router.put('/:id', protect, adminOnly, upload.single('logo'), updateBrand);
router.delete('/:id', protect, adminOnly, deleteBrand);

export default router;
