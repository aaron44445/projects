import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  listStaff,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} from '../controllers/staff.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Read operations - all authenticated users
router.get('/', listStaff);
router.get('/:id', getStaff);

// Write operations - MANAGER and OWNER only
router.post('/', requireRole(['MANAGER', 'OWNER']), createStaff);
router.put('/:id', requireRole(['MANAGER', 'OWNER']), updateStaff);
router.delete('/:id', requireRole(['MANAGER', 'OWNER']), deleteStaff);

export default router;
