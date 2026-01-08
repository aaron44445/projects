import { Router } from 'express';
import authRoutes from './auth.routes.js';
import invitationRoutes from './invitation.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/invitations', invitationRoutes);

// TODO: Add more routes as we build them
// router.use('/clients', clientRoutes);
// router.use('/services', serviceRoutes);
// router.use('/staff', staffRoutes);
// router.use('/appointments', appointmentRoutes);
// router.use('/products', productRoutes);
// router.use('/transactions', transactionRoutes);

export default router;
