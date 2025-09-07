import { Router } from 'express';
import {getMe, listUsers, updateUser} from '../controllers/user.controller';
import asyncMiddleware from "../middlewares/asyncMiddleware";
import authMiddleware from "../middlewares/authMiddleware";

const router = Router();

router.get('/users',authMiddleware, asyncMiddleware(listUsers));
router.put('/users/me',authMiddleware, asyncMiddleware(updateUser));
router.get('/users/me',authMiddleware, asyncMiddleware(getMe));

export default router;
