// src/routes/event.routes.ts
import { Router } from 'express';
import {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    partialUpdateEvent,
    deleteEvent,
} from '../controllers/events.controller';
import asyncMiddleware from '../middlewares/asyncMiddleware';

const eventRoutes = Router();

eventRoutes.post('/events', asyncMiddleware(createEvent));
eventRoutes.get('/events', asyncMiddleware(getAllEvents));
eventRoutes.get('/events/:id', asyncMiddleware(getEventById));
eventRoutes.put('/events/:id', asyncMiddleware(updateEvent));
eventRoutes.patch('/events/:id', asyncMiddleware(partialUpdateEvent));
eventRoutes.delete('/events/:id', asyncMiddleware(deleteEvent));

export default eventRoutes;