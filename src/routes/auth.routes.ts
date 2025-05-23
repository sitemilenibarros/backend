import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/auth.controller';
import asyncMiddleware from '../middlewares/asyncMiddleware'; // Importando o middleware de erro

const authRoutes = Router();

authRoutes.post('/register', asyncMiddleware(registerUser));

authRoutes.post('/login', asyncMiddleware(loginUser));

export default authRoutes;
