import { Router } from 'express';
import authRoutes from './auth.routes.js';
import invitationRoutes from './invitation.routes.js';
import clientRoutes from './client.routes.js';
import serviceRoutes from './service.routes.js';
import staffRoutes from './staff.routes.js';
import appointmentRoutes from './appointment.routes.js';
import productRoutes from './product.routes.js';
import transactionRoutes from './transaction.routes.js';
import consumerRoutes from './consumer.routes.js';
import marketplaceRoutes from './marketplace.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes - Dashboard (authenticated)
router.use('/auth', authRoutes);
router.use('/invitations', invitationRoutes);
router.use('/clients', clientRoutes);
router.use('/services', serviceRoutes);
router.use('/staff', staffRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/products', productRoutes);
router.use('/transactions', transactionRoutes);
router.use('/marketplace', marketplaceRoutes);

// Mount routes - Consumer/Public API
router.use('/consumer', consumerRoutes);

export default router;
