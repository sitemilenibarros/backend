import { Router } from 'express';
import {
    createEvent,
    getAllEvents,
    getEventBySource,
    updateEvent,
    partialUpdateEvent,
    markAsComplete,
    deleteEvent,
    getEventSchema,
} from '../controllers/events.controller';
import asyncMiddleware from '../middlewares/asyncMiddleware';

const eventsRoutes = Router();

eventsRoutes.post('/eventsPage', asyncMiddleware(createEvent));
eventsRoutes.get('/eventsPage', asyncMiddleware(getAllEvents));
eventsRoutes.get('/eventsPage/:event_source', asyncMiddleware(getEventBySource));
eventsRoutes.put('/eventsPage/:event_source', asyncMiddleware(updateEvent));
eventsRoutes.patch('/eventsPage/:event_source', asyncMiddleware(partialUpdateEvent));
eventsRoutes.put('/eventsPage/:event_source/complete', asyncMiddleware(markAsComplete));
eventsRoutes.delete('/eventsPage/:event_source', asyncMiddleware(deleteEvent));

eventsRoutes.get('/eventsPage/schema/:event_source', asyncMiddleware(getEventSchema));

export default eventsRoutes;