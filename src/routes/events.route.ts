import { Router } from 'express';
import {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    partialUpdateEvent,
    deleteEvent,
    sendMailToEvent,
} from '../controllers/events.controller';
import {
    createStripeProduct,
    createStripePrice, createCheckoutSession,
} from '../controllers/stripe.controller';
import asyncMiddleware from '../middlewares/asyncMiddleware';

const eventRoutes = Router();

eventRoutes.post('/events', asyncMiddleware(createEvent));
eventRoutes.get('/events', asyncMiddleware(getAllEvents));
eventRoutes.get('/events/:id', asyncMiddleware(getEventById));
eventRoutes.put('/events/:id', asyncMiddleware(updateEvent));
eventRoutes.patch('/events/:id', asyncMiddleware(partialUpdateEvent));
eventRoutes.delete('/events/:id', asyncMiddleware(deleteEvent));

eventRoutes.post('/events/:id/stripe/product', asyncMiddleware(createStripeProduct));
eventRoutes.post('/events/:id/stripe/price', asyncMiddleware(createStripePrice));
eventRoutes.post('/events/:id/stripe/checkout', asyncMiddleware(createCheckoutSession));
eventRoutes.post('/events/:eventId/send-mail', asyncMiddleware(sendMailToEvent));

export default eventRoutes;