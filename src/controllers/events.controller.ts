import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import EventsPageFactory from '../models/events.model';
import sequelize from '../config/db';

const EventsPage = EventsPageFactory(sequelize);

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
        subtitle,
        description,
        price,
        stripePriceId,
        type,
        maxPresentialParticipants,
        participants,
        objectives,
        targetAudience,
        methods,
        eventDate,
        startTime,
        endTime,
        breakDuration,
        formats,
        location,
        onlineLink,
        materials,
        limitedSeats,
        bonuses,
        faqs,
        ctaText,
        ctaUrl,
    } = req.body;

    const images = req.files ? (req.files as Express.Multer.File[]).map(file => file.path) : [];

    try {
        const newPage = await EventsPage.create({
            title,
            subtitle,
            description,
            price,
            stripePriceId,
            type,
            maxPresentialParticipants,
            participants,
            objectives,
            targetAudience,
            methods,
            eventDate,
            startTime,
            endTime,
            breakDuration,
            formats,
            location,
            onlineLink,
            materials,
            limitedSeats,
            bonuses,
            faqs,
            ctaText,
            ctaUrl,
            images,
        });

        const pageWithImageUrls = {
            ...newPage.toJSON(),
            images: newPage.images?.map(img => `http://localhost:3000/assets/events/${path.basename(img)}`),
        };

        return res.status(201).json({ message: 'Página de evento criada com sucesso!', event: pageWithImageUrls });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao criar página de evento' });
    }
};

export const getAllEvents = async (_req: Request, res: Response): Promise<Response> => {
    try {
        const pages = await EventsPage.findAll();
        const pagesWithImageUrls = pages.map(page => ({
            ...page.toJSON(),
            images: page.images?.map(img => `http://localhost:3000/assets/events/${path.basename(img)}`),
        }));
        return res.status(200).json({ events: pagesWithImageUrls });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao listar páginas de evento' });
    }
};

export const getEventById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try {
        const page = await EventsPage.findByPk(id);
        if (!page) return res.status(404).json({ message: 'Página de evento não encontrada' });

        const pageWithImageUrls = {
            ...page.toJSON(),
            images: page.images?.map(img => `http://localhost:3000/assets/events/${path.basename(img)}`),
        };

        return res.status(200).json({ event: pageWithImageUrls });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao buscar página de evento' });
    }
};

export const updateEvent = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const {
        title,
        subtitle,
        description,
        price,
        stripePriceId,
        type,
        maxPresentialParticipants,
        participants,
        objectives,
        targetAudience,
        methods,
        eventDate,
        startTime,
        endTime,
        breakDuration,
        formats,
        location,
        onlineLink,
        materials,
        limitedSeats,
        bonuses,
        faqs,
        ctaText,
        ctaUrl,
    } = req.body;

    const images = req.files ? (req.files as Express.Multer.File[]).map(file => file.path) : [];

    try {
        const page = await EventsPage.findByPk(id);
        if (!page) return res.status(404).json({ message: 'Página de evento não encontrada' });

        if (images.length && page.images?.length) {
            page.images.forEach(img => {
                const imgPath = path.resolve('assets', 'events', path.basename(img));
                fs.unlink(imgPath, err => err && console.error(err));
            });
        }

        await page.update({
            title,
            subtitle,
            description,
            price,
            stripePriceId,
            type,
            maxPresentialParticipants,
            participants,
            objectives,
            targetAudience,
            methods,
            eventDate,
            startTime,
            endTime,
            breakDuration,
            formats,
            location,
            onlineLink,
            materials,
            limitedSeats,
            bonuses,
            faqs,
            ctaText,
            ctaUrl,
            images: images.length ? images : page.images,
        });

        const updatedPage = await EventsPage.findByPk(id);
        const pageWithImageUrls = {
            ...updatedPage!.toJSON(),
            images: updatedPage!.images?.map(img => `http://localhost:3000/assets/events/${path.basename(img)}`),
        };

        return res.status(200).json({ message: 'Página de evento atualizada com sucesso!', event: pageWithImageUrls });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao atualizar página de evento' });
    }
};

export const deleteEvent = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try {
        const page = await EventsPage.findByPk(id);
        if (!page) return res.status(404).json({ message: 'Página de evento não encontrada' });

        if (page.images?.length) {
            page.images.forEach(img => {
                const imgPath = path.resolve('assets', 'events', path.basename(img));
                fs.unlink(imgPath, err => err && console.error(err));
            });
        }

        await page.destroy();
        await sequelize.query("SELECT setval('events_pages_id_seq', (SELECT COALESCE(MAX(id),0) FROM events_pages));");

        return res.status(200).json({ message: 'Página de evento deletada com sucesso!' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao deletar página de evento' });
    }
};
