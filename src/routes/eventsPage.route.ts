import { Router } from 'express';
import {
    createEventPage,
    getAllEventPages,
    getEventPagesByEventId,
    getEventPageBySource,
    updateEventPage,
    partialUpdateEventPage,
    deleteEventPage,
    getEventSchema, deleteEventPagesByEventId,
} from '../controllers/eventsPage.controller';
import asyncMiddleware from '../middlewares/asyncMiddleware';
import authMiddleware from '../middlewares/authMiddleware';

const eventsPageRoutes = Router();

eventsPageRoutes.post('/event-pages', authMiddleware, asyncMiddleware(createEventPage));
eventsPageRoutes.get('/event-pages', asyncMiddleware(getAllEventPages));
eventsPageRoutes.get('/event-pages/by-event/:event_id', asyncMiddleware(getEventPagesByEventId));

eventsPageRoutes.get('/event-pages/:event_id/:event_source', asyncMiddleware(getEventPageBySource));
eventsPageRoutes.put('/event-pages/:event_id/:event_source', authMiddleware, asyncMiddleware(updateEventPage));
eventsPageRoutes.patch('/event-pages/:event_id/:event_source', authMiddleware, asyncMiddleware(partialUpdateEventPage));
eventsPageRoutes.delete('/event-pages/:event_id/:event_source', authMiddleware, asyncMiddleware(deleteEventPage));
eventsPageRoutes.delete('/event-pages/:event_id', authMiddleware, asyncMiddleware(deleteEventPagesByEventId));

eventsPageRoutes.get('/event-pages/schema/:event_source', asyncMiddleware(getEventSchema));

export default eventsPageRoutes;