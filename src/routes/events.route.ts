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

// Rota para criar um novo evento
eventsRoutes.post('/events', asyncMiddleware(createEvent));

// Rota para listar todos os eventos
eventsRoutes.get('/events', asyncMiddleware(getAllEvents));

// Rota para buscar um evento pela chave event_source
eventsRoutes.get('/events/:event_source', asyncMiddleware(getEventBySource));

// Rota para atualização completa do evento
eventsRoutes.put('/events/:event_source', asyncMiddleware(updateEvent));

// Rota para atualização parcial do evento
eventsRoutes.patch('/events/:event_source', asyncMiddleware(partialUpdateEvent));

// Rota para marcar um evento como completo
eventsRoutes.put('/events/:event_source/complete', asyncMiddleware(markAsComplete));

// Rota para deletar um evento
eventsRoutes.delete('/events/:event_source', asyncMiddleware(deleteEvent));

eventsRoutes.get('/events/schema/:event_source', asyncMiddleware(getEventSchema));

export default eventsRoutes;