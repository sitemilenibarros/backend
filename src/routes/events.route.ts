import { Router } from 'express';
import {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    partialUpdateEvent,
    deleteEvent,
    sendMailToEvent,
    sendMailOnsiteToEvent,
    createMercadoPagoPreference,
    mercadoPagoWebhook,
} from '../controllers/events.controller';
import asyncMiddleware from '../middlewares/asyncMiddleware';
import authMiddleware from '../middlewares/authMiddleware';

const eventRoutes = Router();

eventRoutes.post('/events', authMiddleware, asyncMiddleware(createEvent));
eventRoutes.get('/events', asyncMiddleware(getAllEvents));
eventRoutes.get('/events/:id', asyncMiddleware(getEventById));
eventRoutes.put('/events/:id', authMiddleware, asyncMiddleware(updateEvent));
eventRoutes.patch('/events/:id', authMiddleware, asyncMiddleware(partialUpdateEvent));
eventRoutes.delete('/events/:id', authMiddleware, asyncMiddleware(deleteEvent));

eventRoutes.post('/events/:eventId/send-mail', authMiddleware, asyncMiddleware(sendMailToEvent));
eventRoutes.post('/events/:eventId/send-mail-onsite', authMiddleware, asyncMiddleware(sendMailOnsiteToEvent));

eventRoutes.post('/mercadopago/create-preference', asyncMiddleware(createMercadoPagoPreference));
eventRoutes.post('/webhook/mercadopago', asyncMiddleware(mercadoPagoWebhook));

export default eventRoutes;