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

const eventsPageRoutes = Router();

eventsPageRoutes.post('/event-pages', asyncMiddleware(createEventPage));
eventsPageRoutes.get('/event-pages', asyncMiddleware(getAllEventPages));
eventsPageRoutes.get('/event-pages/by-event/:event_id', asyncMiddleware(getEventPagesByEventId));

eventsPageRoutes.get('/event-pages/:event_id/:event_source', asyncMiddleware(getEventPageBySource));
eventsPageRoutes.put('/event-pages/:event_id/:event_source', asyncMiddleware(updateEventPage));
eventsPageRoutes.patch('/event-pages/:event_id/:event_source', asyncMiddleware(partialUpdateEventPage));
eventsPageRoutes.delete('/event-pages/:event_id/:event_source', asyncMiddleware(deleteEventPage));
eventsPageRoutes.delete('/event-pages/:event_id', asyncMiddleware(deleteEventPagesByEventId));

eventsPageRoutes.get('/event-pages/schema/:event_source', asyncMiddleware(getEventSchema));

export default eventsPageRoutes;