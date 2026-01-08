import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  listAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} from '../controllers/appointment.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', listAppointments);
router.get('/:id', getAppointment);
router.post('/', createAppointment);
router.put('/:id', updateAppointment);
router.patch('/:id/status', updateAppointmentStatus);
router.delete('/:id', deleteAppointment);

export default router;
