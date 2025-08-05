import { Router } from 'express';
import { upload, uploadAsset, deleteAsset } from '../controllers/assets.controller';
import asyncMiddleware from "../middlewares/asyncMiddleware";

const router = Router();

router.post('/upload', upload.single('asset'), asyncMiddleware(uploadAsset));
router.delete('/delete/:filename', asyncMiddleware(deleteAsset));

export default router;