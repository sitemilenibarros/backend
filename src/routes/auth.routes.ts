import { Router } from 'express';
import { registerUser, loginUser, checkToken } from '../controllers/auth.controller';
import asyncMiddleware from '../middlewares/asyncMiddleware';

const authRoutes = Router();

authRoutes.post('/register', asyncMiddleware(registerUser));

authRoutes.post('/login', asyncMiddleware(loginUser));

authRoutes.get('/check-token', asyncMiddleware(checkToken));

export default authRoutes;
