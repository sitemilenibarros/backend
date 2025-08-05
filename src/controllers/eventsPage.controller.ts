import { Request, Response } from 'express';
import EventPageFactory from '../models/eventsPage.model';
import sequelize from '../config/db';
import { hydrateEventWithSchema, validateEventPageData, loadSchema } from '../utils/schema_handler';

const EventPage = EventPageFactory(sequelize);

export const createEventPage = async (req: Request, res: Response): Promise<Response> => {
    const { event_id, event_source, content } = req.body;

    if (!event_id || !event_source || !content) {
        return res.status(400).json({ message: 'Os campos event_id, event_source e content são obrigatórios.' });
    }

    const validation = validateEventPageData(event_source, content);
    if (!validation.isValid) {
        return res.status(400).json({ message: 'Erro de validação', errors: validation.errors });
    }

    try {
        const newEventPage = await EventPage.create({
            event_id,
            event_source,
            content,
        });

        return res.status(201).json(newEventPage.toJSON());
    } catch (err: any) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: `A chave '${event_source}' já existe.` });
        }
        console.error(err);
        return res.status(500).json({ message: 'Erro ao criar página de evento.' });
    }
};

export const getAllEventPages = async (_req: Request, res: Response): Promise<Response> => {
    try {
        const allEventPages = await EventPage.findAll();
        const pagesList = allEventPages.map(page => page.toJSON());
        return res.status(200).json({ pages: pagesList });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao listar páginas de evento.' });
    }
};

export const getEventPagesByEventId = async (req: Request, res: Response): Promise<Response> => {
    const { event_id } = req.params;

    try {
        const eventPagesFound = await EventPage.findAll({
            where: { event_id },
            order: [['event_source', 'ASC']]
        });

        if (eventPagesFound.length === 0) {
            return res.status(404).json({ message: 'Nenhuma página de evento encontrada para este ID.' });
        }

        const pages = eventPagesFound.map(page => page.toJSON());

        return res.status(200).json({ event_pages: pages });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao buscar páginas de evento por ID.' });
    }
};

export const getEventPageBySource = async (req: Request, res: Response): Promise<Response> => {
    const { event_id, event_source } = req.params;
    try {
        const pageFound = await EventPage.findOne({
            where: { event_id, event_source },
        });

        if (!pageFound) {
            return res.status(404).json({ message: 'Página de evento não encontrada para este evento.' });
        }

        const pageContent = pageFound.toJSON().content;
        const hydratedPage = hydrateEventWithSchema(event_source, pageContent);

        return res.status(200).json(hydratedPage);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao buscar página de evento.' });
    }
};

export const updateEventPage = async (req: Request, res: Response): Promise<Response> => {
    const { event_id, event_source } = req.params;
    const { ...contentData } = req.body;

    const validation = validateEventPageData(event_source, contentData);
    if (!validation.isValid) {
        return res.status(400).json({ message: 'Erro de validação', errors: validation.errors });
    }

    try {
        const [updated] = await EventPage.update({ content: contentData }, {
            where: { event_id, event_source }
        });

        if (updated === 0) {
            return res.status(404).json({ message: 'Página de evento não encontrada para este evento.' });
        }

        const updatedPage = await EventPage.findOne({ where: { event_id, event_source } });

        return res.status(200).json(updatedPage?.toJSON());
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao atualizar página de evento.' });
    }
};

export const partialUpdateEventPage = async (req: Request, res: Response): Promise<Response> => {
    const { event_id, event_source } = req.params;
    const updates = req.body;

    try {
        const page = await EventPage.findOne({
            where: { event_id, event_source },
        });

        if (!page) {
            return res.status(404).json({ message: 'Página de evento não encontrada para este evento.' });
        }

        const updatedContentData = {
            ...page.content as any,
            ...updates,
        };

        const validation = validateEventPageData(event_source, updatedContentData);
        if (!validation.isValid) {
            return res.status(400).json({ message: 'Erro de validação', errors: validation.errors });
        }

        const updatedPage = await page.update({ content: updatedContentData });

        return res.status(200).json(updatedPage.toJSON());
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao atualizar página de evento parcialmente.' });
    }
};

export const deleteEventPage = async (req: Request, res: Response): Promise<Response> => {
    const { event_id, event_source } = req.params;
    try {
        const deletedRows = await EventPage.destroy({
            where: { event_id, event_source },
        });

        if (deletedRows === 0) {
            return res.status(404).json({ message: 'Página de evento não encontrada para este evento.' });
        }

        return res.status(200).json({ message: 'Página de evento deletada com sucesso!' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao deletar página de evento.' });
    }
};

export const deleteEventPagesByEventId = async (req: Request, res: Response): Promise<Response> => {
    const { event_id } = req.params;
    try {
        const deletedRows = await EventPage.destroy({
            where: { event_id },
        });

        if (deletedRows === 0) {
            return res.status(404).json({ message: 'Nenhuma página de evento encontrada para este ID.' });
        }

        return res.status(200).json({ message: 'Páginas de evento deletadas com sucesso!' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao deletar páginas de evento.' });
    }
}

export const getEventSchema = async (req: Request, res: Response): Promise<Response> => {
    const { event_source } = req.params;
    const schema = loadSchema(event_source);
    if (!schema) {
        return res.status(404).json({ message: 'Esquema de evento não encontrado.' });
    }
    return res.status(200).json({ schema });
};