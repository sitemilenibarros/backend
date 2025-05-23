import { Router } from 'express';
import {
    createService,
    getAllServices,
    getServiceById,
    updateService,
    deleteService
} from '../controllers/service.controller';
import asyncMiddleware from '../middlewares/asyncMiddleware';
import multer from 'multer';
import path from 'path';


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'assets/services');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Garante nome único
    }
});

const upload = multer({ storage });


const serviceRoutes = Router();

serviceRoutes.post('/services', upload.single('image'), asyncMiddleware(createService));

serviceRoutes.get('/services', asyncMiddleware(getAllServices));

serviceRoutes.get('/services/:id', asyncMiddleware(getServiceById));

serviceRoutes.put('/services/:id', upload.single('image'), asyncMiddleware(updateService));

serviceRoutes.delete('/services/:id', asyncMiddleware(deleteService));

export default serviceRoutes;
