import { Router } from 'express';
import { registerUser, loginUser, checkToken, requestPasswordReset, verifyResetCode, resetPassword, changePassword } from '../controllers/auth.controller';
import asyncMiddleware from '../middlewares/asyncMiddleware';
import authMiddleware from '../middlewares/authMiddleware';

const authRoutes = Router();

authRoutes.post('/register', asyncMiddleware(registerUser));
authRoutes.post('/login', asyncMiddleware(loginUser));
authRoutes.get('/check-token', authMiddleware, asyncMiddleware(checkToken));
authRoutes.post('/forgot-password', asyncMiddleware(requestPasswordReset));
authRoutes.post('/verify-reset-code', asyncMiddleware(verifyResetCode));
authRoutes.post('/reset-password', asyncMiddleware(resetPassword));
authRoutes.post('/change-password', authMiddleware, asyncMiddleware(changePassword));

export default authRoutes;
