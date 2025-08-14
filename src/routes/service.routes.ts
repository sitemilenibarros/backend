import { Router } from 'express';
import {
    createService,
    getAllServices,
    getServiceById,
    updateService,
    deleteService
} from '../controllers/service.controller';
import asyncMiddleware from '../middlewares/asyncMiddleware';

const serviceRoutes = Router();

serviceRoutes.post('/services', asyncMiddleware(createService));

serviceRoutes.get('/services', asyncMiddleware(getAllServices));

serviceRoutes.get('/services/:id', asyncMiddleware(getServiceById));

serviceRoutes.put('/services/:id', asyncMiddleware(updateService));

serviceRoutes.delete('/services/:id', asyncMiddleware(deleteService));

export default serviceRoutes;
