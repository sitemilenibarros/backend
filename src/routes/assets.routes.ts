import { Router } from 'express';
import {upload, uploadAsset, deleteAsset, listAssets} from '../controllers/assets.controller';
import asyncMiddleware from "../middlewares/asyncMiddleware";

const router = Router();

router.post('/upload', upload.single('asset'), asyncMiddleware(uploadAsset));
router.delete('/delete/:filename', asyncMiddleware(deleteAsset));
router.get('/', asyncMiddleware(listAssets));

export default router;