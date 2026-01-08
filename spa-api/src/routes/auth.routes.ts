import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as authController from '../controllers/auth.controller.js';
import {
  registerSchema,
  customerRegisterSchema,
  loginSchema,
  refreshSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
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

// Public routes - Business registration
router.post('/register', validate(registerSchema), authController.register);
// Public routes - Customer registration
router.post('/register/customer', validate(customerRegisterSchema), authController.registerCustomer);
// Public routes - Login (handles both types)
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', validate(refreshSchema), authController.logout);
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.get('/me', authenticate, authController.me as any);
router.post('/resend-verification', authenticate, authController.resendVerification as any);

export default router;
