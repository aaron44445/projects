import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  listTransactions,
  getTransaction,
  createTransaction,
  getDailySummary,
} from '../controllers/transaction.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List and view - all authenticated users
router.get('/', listTransactions);
router.get('/summary', getDailySummary);
router.get('/:id', getTransaction);

// Create transaction - all staff can create
router.post('/', createTransaction);

// Note: Transactions are immutable once created (no update/delete)
// Refunds are handled by creating a new REFUND transaction

export default router;
