import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import EventFactory from '../models/events.model';
import sequelize from '../config/db';

const Event = EventFactory(sequelize);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, 'assets/events'),
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

export const upload = multer({ storage });

export const createEvent = async (req: Request, res: Response): Promise<Response> => {
    const {
        title,
        description,
        date,
        time,
        location,
        link,
        benefits,
        faq,
        price,
        type,
        maxPresentialParticipants,
    } = req.body;
    const images = req.files ? (req.files as Express.Multer.File[]).map(file => file.path) : [];

    try {
        const newEvent = await Event.create({
            title,
            description,
            date,
            time,
            location,
            link,
            benefits,
            faq,
            price,
            images,
            type,
            maxPresentialParticipants,
        });

        const eventWithImageUrls = {
            ...newEvent.toJSON(),
            images: images.map(img => `http://localhost:3000/assets/events/${path.basename(img)}`),
        };

        return res.status(201).json({ message: 'Evento criado com sucesso!', event: eventWithImageUrls });
    } catch (err) {
        console.error('Erro ao criar evento:', err);
        return res.status(500).json({ message: 'Erro ao criar evento' });
    }
};

export const getAllEvents = async (_: Request, res: Response): Promise<Response> => {
    try {
        const events = await Event.findAll();
        const eventsWithImageUrls = events.map(event => ({
            ...event.toJSON(),
            images: event.images?.map(img => `http://localhost:3000/assets/events/${path.basename(img)}`),
        }));
        return res.status(200).json({ events: eventsWithImageUrls });
    } catch (err) {
        console.error('Erro ao listar eventos:', err);
        return res.status(500).json({ message: 'Erro ao listar eventos' });
    }
};

export const getEventById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try {
        const event = await Event.findByPk(id);
        if (!event) return res.status(404).json({ message: 'Evento não encontrado' });

        const eventWithImageUrls = {
            ...event.toJSON(),
            images: event.images?.map(img => `http://localhost:3000/assets/events/${path.basename(img)}`),
        };

        return res.status(200).json({ event: eventWithImageUrls });
    } catch (err) {
        console.error('Erro ao buscar evento:', err);
        return res.status(500).json({ message: 'Erro ao buscar evento' });
    }
};

export const updateEvent = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const {
        title,
        description,
        date,
        time,
        location,
        link,
        benefits,
        faq,
        price,
        type,
        maxPresentialParticipants,
    } = req.body;
    const images = req.files ? (req.files as Express.Multer.File[]).map(file => file.path) : [];

    try {
        const event = await Event.findByPk(id);
        if (!event) return res.status(404).json({ message: 'Evento não encontrado' });

        if (images.length > 0 && event.images?.length) {
            event.images.forEach(img => {
                const imgPath = path.resolve('assets', 'events', path.basename(img));
                fs.unlink(imgPath, err => err && console.error(`Erro ao excluir imagem: ${imgPath}`, err));
            });
        }

        await event.update({
            title,
            description,
            date,
            time,
            location,
            link,
            benefits,
            faq,
            price,
            images: images.length ? images : event.images,
            type,
            maxPresentialParticipants,
        });

        const eventWithImageUrls = {
            ...event.toJSON(),
            images: (images.length ? images : event.images)?.map(img => `http://localhost:3000/assets/events/${path.basename(img)}`),
        };

        return res.status(200).json({ message: 'Evento atualizado com sucesso!', event: eventWithImageUrls });
    } catch (err) {
        console.error('Erro ao atualizar evento:', err);
        return res.status(500).json({ message: 'Erro ao atualizar evento' });
    }
};

export const deleteEvent = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try {
        const event = await Event.findByPk(id);
        if (!event) return res.status(404).json({ message: 'Evento não encontrado' });

        if (event.images?.length) {
            event.images.forEach(img => {
                const imgPath = path.resolve('assets', 'events', path.basename(img));
                fs.unlink(imgPath, err => err && console.error(`Erro ao excluir imagem: ${imgPath}`, err));
            });
        }

        await event.destroy();
        await sequelize.query("SELECT setval('events_id_seq', (SELECT MAX(id) FROM events));");
        return res.status(200).json({ message: 'Evento deletado com sucesso' });
    } catch (err) {
        console.error('Erro ao deletar evento:', err);
        return res.status(500).json({ message: 'Erro ao deletar evento' });
    }
};
