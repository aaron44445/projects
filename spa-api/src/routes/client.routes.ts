import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} from '../controllers/client.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', listClients);
router.get('/:id', getClient);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

export default router;
