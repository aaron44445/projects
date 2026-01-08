import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireManager } from '../middleware/requireRole.js';
import * as invitationController from '../controllers/invitation.controller.js';
import {
  createInvitationSchema,
  acceptInvitationSchema,
} from '../schemas/auth.schema.js';

const router = Router();

// Validation middleware
function validate(schema: any) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: result.error.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
    }
    req.body = result.data;
    next();
  };
}

// Public routes (for accepting invitations)
router.get('/token/:token', invitationController.getInvitation);
router.post('/accept', validate(acceptInvitationSchema), invitationController.acceptInvitation);

// Protected routes (require manager or owner)
router.use(authenticate);
router.use(requireManager as any);

router.get('/', invitationController.listInvitations as any);
router.post('/', validate(createInvitationSchema), invitationController.createInvitation as any);
router.delete('/:id', invitationController.deleteInvitation as any);

export default router;
