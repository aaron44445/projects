import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  listServices,
  getService,
  createService,
  updateService,
  deleteService,
} from '../controllers/service.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Read operations - all authenticated users
router.get('/', listServices);
router.get('/:id', getService);

// Write operations - MANAGER and OWNER only
router.post('/', requireRole(['MANAGER', 'OWNER']), createService);
router.put('/:id', requireRole(['MANAGER', 'OWNER']), updateService);
router.delete('/:id', requireRole(['MANAGER', 'OWNER']), deleteService);

export default router;
