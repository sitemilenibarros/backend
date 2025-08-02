import { Request, Response } from 'express';
import EventFactory from '../models/events.model';
import sequelize from '../config/db';
import { hydrateEventWithSchema, validateEventData, loadSchema } from '../utils/schema_handler';

const Event = EventFactory(sequelize);

export const createEvent = async (req: Request, res: Response): Promise<Response> => {
    const { event_source, event } = req.body;

    if (!event_source || !event) {
        return res.status(400).json({ message: 'Os campos event_source e event são obrigatórios.' });
    }

    const validation = validateEventData(event_source, event);
    if (!validation.isValid) {
        return res.status(400).json({ message: 'Erro de validação', errors: validation.errors });
    }

    try {
        const newEvent = await Event.create({
            event_source,
            event,
        });

        return res.status(201).json(newEvent.toJSON());
    } catch (err: any) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: `A chave '${event_source}' já existe.` });
        }
        console.error(err);
        return res.status(500).json({ message: 'Erro ao criar evento.' });
    }
};

export const getAllEvents = async (_req: Request, res: Response): Promise<Response> => {
    try {
        const allEvents = await Event.findAll();
        const eventsList = allEvents.map(e => e.toJSON());
        return res.status(200).json({ events: eventsList });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao listar eventos.' });
    }
};

export const getEventBySource = async (req: Request, res: Response): Promise<Response> => {
    const { event_source } = req.params;
    try {
        const eventFound = await Event.findByPk(event_source);

        if (!eventFound) {
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }

        const eventData = eventFound.toJSON().event;
        const hydratedEvent = hydrateEventWithSchema(event_source, eventData);

        return res.status(200).json(hydratedEvent);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao buscar evento.' });
    }
};

export const updateEvent = async (req: Request, res: Response): Promise<Response> => {
    const { event_source } = req.params;
    const { ...eventData } = req.body;

    const validation = validateEventData(event_source, eventData);
    if (!validation.isValid) {
        return res.status(400).json({ message: 'Erro de validação', errors: validation.errors });
    }

    try {
        const event = await Event.findByPk(event_source);
        if (!event) {
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }

        const updatedEvent = await event.update({ event: eventData });

        return res.status(200).json(updatedEvent.toJSON());
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao atualizar evento.' });
    }
};

export const partialUpdateEvent = async (req: Request, res: Response): Promise<Response> => {
    const { event_source } = req.params;
    const updates = req.body;

    try {
        const event = await Event.findByPk(event_source);
        if (!event) {
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }

        const updatedEventData = {
            ...event.event as any,
            ...updates,
        };

        const validation = validateEventData(event_source, updatedEventData);
        if (!validation.isValid) {
            return res.status(400).json({ message: 'Erro de validação', errors: validation.errors });
        }

        const updatedEvent = await event.update({ event: updatedEventData });

        return res.status(200).json(updatedEvent.toJSON());
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao atualizar evento parcialmente.' });
    }
};

export const markAsComplete = async (req: Request, res: Response): Promise<Response> => {
    const { event_source } = req.params;

    try {
        const event = await Event.findByPk(event_source);
        if (!event) {
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }

        const updatedEventData = {
            ...event.event as any,
            isComplete: true,
        };

        const validation = validateEventData(event_source, updatedEventData);
        if (!validation.isValid) {
            return res.status(400).json({ message: 'Erro de validação', errors: validation.errors });
        }

        const updatedEvent = await event.update({ event: updatedEventData });

        return res.status(200).json(updatedEvent.toJSON());
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao marcar evento como completo.' });
    }
};

export const deleteEvent = async (req: Request, res: Response): Promise<Response> => {
    const { event_source } = req.params;
    try {
        const event = await Event.findByPk(event_source);
        if (!event) {
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }

        await event.destroy();

        return res.status(200).json({ message: 'Evento deletado com sucesso!' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao deletar evento.' });
    }
};

export const getEventSchema = async (req: Request, res: Response): Promise<Response> => {
    const { event_source } = req.params;
    const schema = loadSchema(event_source);
    if (!schema) {
        return res.status(404).json({ message: 'Esquema de evento não encontrado.' });
    }
    return res.status(200).json({ schema });
};