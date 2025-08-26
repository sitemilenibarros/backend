import { Router } from 'express';
import {upload, uploadAsset, deleteAsset, listAssets} from '../controllers/assets.controller';
import asyncMiddleware from "../middlewares/asyncMiddleware";
import authMiddleware from "../middlewares/authMiddleware";

const router = Router();

router.post('/upload', authMiddleware, upload.single('asset'), asyncMiddleware(uploadAsset));
router.delete('/delete/:filename', authMiddleware, asyncMiddleware(deleteAsset));
router.get('/', asyncMiddleware(listAssets));

export default router;