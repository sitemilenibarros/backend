import { Router } from 'express';
import {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent
} from '../controllers/events.controller';
import asyncMiddleware from '../middlewares/asyncMiddleware';
import multer from 'multer';
import path from 'path';


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'assets/events');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage, limits: { files: 5 } });

const eventsRoutes = Router();

eventsRoutes.post('/events', upload.array('images', 5), asyncMiddleware(createEvent));

eventsRoutes.get('/events', asyncMiddleware(getAllEvents));

eventsRoutes.get('/events/:id', asyncMiddleware(getEventById));

eventsRoutes.put('/events/:id', upload.array('images', 5), asyncMiddleware(updateEvent));

eventsRoutes.delete('/events/:id', asyncMiddleware(deleteEvent));

export default eventsRoutes;
