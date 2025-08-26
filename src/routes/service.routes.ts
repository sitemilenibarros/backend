import { Router } from 'express';
import {
    createService,
    getAllServices,
    getServiceById,
    updateService,
    deleteService
} from '../controllers/service.controller';
import asyncMiddleware from '../middlewares/asyncMiddleware';
import authMiddleware from '../middlewares/authMiddleware';

const serviceRoutes = Router();

serviceRoutes.post('/services', authMiddleware, asyncMiddleware(createService));

serviceRoutes.get('/services', asyncMiddleware(getAllServices));

serviceRoutes.get('/services/:id', asyncMiddleware(getServiceById));

serviceRoutes.put('/services/:id', authMiddleware, asyncMiddleware(updateService));

serviceRoutes.delete('/services/:id', authMiddleware, asyncMiddleware(deleteService));

export default serviceRoutes;
