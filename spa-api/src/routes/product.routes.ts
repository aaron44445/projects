import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustQuantity,
} from '../controllers/product.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Read operations - all authenticated users
router.get('/', listProducts);
router.get('/:id', getProduct);

// Write operations - MANAGER and OWNER only
router.post('/', requireRole(['MANAGER', 'OWNER']), createProduct);
router.put('/:id', requireRole(['MANAGER', 'OWNER']), updateProduct);
router.delete('/:id', requireRole(['MANAGER', 'OWNER']), deleteProduct);

// Quantity adjustment - all staff can adjust inventory
router.patch('/:id/quantity', adjustQuantity);

export default router;
