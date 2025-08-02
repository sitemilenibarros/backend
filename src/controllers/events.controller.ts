import { Request, Response } from 'express';
import EventFactory from '../models/events.model';
import sequelize from '../config/db';

const Event = EventFactory(sequelize);

export const createEvent = async (req: Request, res: Response): Promise<Response> => {
    try {
        const newEvent = await Event.create(req.body);
        return res.status(201).json(newEvent.toJSON());
    } catch (err: any) {
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

export const getEventById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try {
        const eventFound = await Event.findByPk(id);

        if (!eventFound) {
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }

        return res.status(200).json(eventFound.toJSON());
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao buscar evento.' });
    }
};

export const updateEvent = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const [updated] = await Event.update(updates, {
            where: { id },
        });

        if (updated === 0) {
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }

        const updatedEvent = await Event.findByPk(id);

        return res.status(200).json(updatedEvent?.toJSON());
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao atualizar evento.' });
    }
};

export const partialUpdateEvent = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const event = await Event.findByPk(id);

        if (!event) {
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }

        const updatedEvent = await event.update(updates);

        return res.status(200).json(updatedEvent.toJSON());
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao atualizar evento parcialmente.' });
    }
};

export const deleteEvent = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try {
        const deletedRows = await Event.destroy({
            where: { id },
        });

        if (deletedRows === 0) {
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }

        return res.status(200).json({ message: 'Evento deletado com sucesso!' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao deletar evento.' });
    }
};