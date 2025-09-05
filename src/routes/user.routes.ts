import { Router } from 'express';
import { listUsers, updateUser } from '../controllers/user.controller';
import asyncMiddleware from "../middlewares/asyncMiddleware";
import authMiddleware from "../middlewares/authMiddleware";

const router = Router();

router.get('/users',authMiddleware, asyncMiddleware(listUsers));
router.put('/users/me',authMiddleware, asyncMiddleware(updateUser));

export default router;
