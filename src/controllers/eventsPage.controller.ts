import { Request, Response } from 'express';
import EventPageFactory from '../models/eventsPage.model';
import sequelize from '../config/db';
import { hydrateEventWithSchema, validateEventPageData, loadSchema } from '../utils/schema_handler';

const EventPage = EventPageFactory(sequelize);

export const createEventPage = async (req: Request, res: Response): Promise<Response> => {
    const { event_id, event_source, content } = req.body;
    console.log('[createEventPage] Recebido:', req.body);
    if (!event_id || !event_source || !content) {
        console.warn('[createEventPage] Campos obrigatórios ausentes.');
        return res.status(400).json({ message: 'Os campos event_id, event_source e content são obrigatórios.' });
    }
    const validation = validateEventPageData(event_source, content);
    if (!validation.isValid) {
        console.warn('[createEventPage] Erro de validação:', validation.errors);
        return res.status(400).json({ message: 'Erro de validação', errors: validation.errors });
    }
    try {
        const newEventPage = await EventPage.create({
            event_id,
            event_source,
            content,
        });
        console.log(`[createEventPage] Página de evento criada`);
        return res.status(201).json(newEventPage.toJSON());
    } catch (err: any) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            console.warn('[createEventPage] Chave já existe:', event_source);
            return res.status(409).json({ message: `A chave '${event_source}' já existe.` });
        }
        console.error('[createEventPage] Erro ao criar página de evento:', err);
        return res.status(500).json({ message: 'Erro ao criar página de evento.' });
    }
};

export const getAllEventPages = async (_req: Request, res: Response): Promise<Response> => {
    console.log('[getAllEventPages] Listando páginas de evento');
    try {
        const allEventPages = await EventPage.findAll();
        const pagesList = allEventPages.map(page => page.toJSON());
        console.log(`[getAllEventPages] Encontradas ${pagesList.length} páginas de evento.`);
        return res.status(200).json({ pages: pagesList });
    } catch (err) {
        console.error('[getAllEventPages] Erro ao listar páginas de evento:', err);
        return res.status(500).json({ message: 'Erro ao listar páginas de evento.' });
    }
};

export const getEventPagesByEventId = async (req: Request, res: Response): Promise<Response> => {
    const { event_id } = req.params;
    console.log(`[getEventPagesByEventId] Buscando páginas para evento ID: ${event_id}`);
    try {
        const eventPagesFound = await EventPage.findAll({
            where: { event_id },
            order: [['event_source', 'ASC']]
        });
        if (eventPagesFound.length === 0) {
            console.warn(`[getEventPagesByEventId] Nenhuma página encontrada para evento ID: ${event_id}`);
            return res.status(404).json({ message: 'Nenhuma página de evento encontrada para este ID.' });
        }
        const pages = eventPagesFound.map(page => page.toJSON());
        console.log(`[getEventPagesByEventId] Encontradas ${pages.length} páginas para evento ID: ${event_id}`);
        return res.status(200).json({ event_pages: pages });
    } catch (err) {
        console.error('[getEventPagesByEventId] Erro ao buscar páginas de evento por ID:', err);
        return res.status(500).json({ message: 'Erro ao buscar páginas de evento por ID.' });
    }
};

export const getEventPageBySource = async (req: Request, res: Response): Promise<Response> => {
    const { event_id, event_source } = req.params;
    console.log(`[getEventPageBySource] Buscando página para evento ID: ${event_id}, source: ${event_source}`);
    try {
        const pageFound = await EventPage.findOne({
            where: { event_id, event_source },
        });
        if (!pageFound) {
            console.warn(`[getEventPageBySource] Página não encontrada para evento ID: ${event_id}, source: ${event_source}`);
            return res.status(404).json({ message: 'Página de evento não encontrada para este evento.' });
        }
        const pageContent = pageFound.toJSON().content;
        const hydratedPage = hydrateEventWithSchema(event_source, pageContent);

        return res.status(200).json(hydratedPage);
    } catch (err) {
        console.error('[getEventPageBySource] Erro ao buscar página de evento:', err);
        return res.status(500).json({ message: 'Erro ao buscar página de evento.' });
    }
};

export const updateEventPage = async (req: Request, res: Response): Promise<Response> => {
    const { event_id, event_source } = req.params;
    const { ...contentData } = req.body;
    console.log(`[updateEventPage] Atualizando página de evento ID: ${event_id}, source: ${event_source}`);
    const validation = validateEventPageData(event_source, contentData);
    if (!validation.isValid) {
        console.warn('[updateEventPage] Erro de validação:', validation.errors);
        return res.status(400).json({ message: 'Erro de validação', errors: validation.errors });
    }
    try {
        const [updated] = await EventPage.update({ content: contentData }, {
            where: { event_id, event_source }
        });
        if (updated === 0) {
            console.warn(`[updateEventPage] Página não encontrada para evento ID: ${event_id}, source: ${event_source}`);
            return res.status(404).json({ message: 'Página de evento não encontrada para este evento.' });
        }
        const updatedPage = await EventPage.findOne({ where: { event_id, event_source } });
        console.log(`[updateEventPage] Página de evento atualizada.`);
        return res.status(200).json(updatedPage?.toJSON());
    } catch (err) {
        console.error('[updateEventPage] Erro ao atualizar página de evento:', err);
        return res.status(500).json({ message: 'Erro ao atualizar página de evento.' });
    }
};

export const partialUpdateEventPage = async (req: Request, res: Response): Promise<Response> => {
    const { event_id, event_source } = req.params;
    const updates = req.body;
    console.log(`[partialUpdateEventPage] Atualização parcial para evento ID: ${event_id}, source: ${event_source}`);
    try {
        const page = await EventPage.findOne({
            where: { event_id, event_source },
        });
        if (!page) {
            console.warn(`[partialUpdateEventPage] Página não encontrada para evento ID: ${event_id}, source: ${event_source}`);
            return res.status(404).json({ message: 'Página de evento não encontrada para este evento.' });
        }
        const updatedContentData = {
            ...page.content as any,
            ...updates,
        };
        const validation = validateEventPageData(event_source, updatedContentData);
        if (!validation.isValid) {
            console.warn('[partialUpdateEventPage] Erro de validação:', validation.errors);
            return res.status(400).json({ message: 'Erro de validação', errors: validation.errors });
        }
        const updatedPage = await page.update({ content: updatedContentData });
        console.log(`[partialUpdateEventPage] Página de evento atualizada parcialmente.`);
        return res.status(200).json(updatedPage.toJSON());
    } catch (err) {
        console.error('[partialUpdateEventPage] Erro ao atualizar página de evento parcialmente:', err);
        return res.status(500).json({ message: 'Erro ao atualizar página de evento parcialmente.' });
    }
};

export const deleteEventPage = async (req: Request, res: Response): Promise<Response> => {
    const { event_id, event_source } = req.params;
    console.log(`[deleteEventPage] Deletando página de evento ID: ${event_id}, source: ${event_source}`);
    try {
        const deletedRows = await EventPage.destroy({
            where: { event_id, event_source },
        });
        if (deletedRows === 0) {
            console.warn(`[deleteEventPage] Página não encontrada para evento ID: ${event_id}, source: ${event_source}`);
            return res.status(404).json({ message: 'Página de evento não encontrada para este evento.' });
        }
        console.log(`[deleteEventPage] Página de evento deletada com sucesso.`);
        return res.status(200).json({ message: 'Página de evento deletada com sucesso!' });
    } catch (err) {
        console.error('[deleteEventPage] Erro ao deletar página de evento:', err);
        return res.status(500).json({ message: 'Erro ao deletar página de evento.' });
    }
};

export const deleteEventPagesByEventId = async (req: Request, res: Response): Promise<Response> => {
    const { event_id } = req.params;
    console.log(`[deleteEventPagesByEventId] Deletando todas as páginas para evento ID: ${event_id}`);
    try {
        const deletedRows = await EventPage.destroy({
            where: { event_id },
        });
        if (deletedRows === 0) {
            console.warn(`[deleteEventPagesByEventId] Nenhuma página encontrada para evento ID: ${event_id}`);
            return res.status(404).json({ message: 'Nenhuma página de evento encontrada para este ID.' });
        }
        console.log(`[deleteEventPagesByEventId] Todas as páginas deletadas para evento ID: ${event_id}`);
        return res.status(200).json({ message: 'Páginas de evento deletadas com sucesso!' });
    } catch (err) {
        console.error('[deleteEventPagesByEventId] Erro ao deletar páginas de evento:', err);
        return res.status(500).json({ message: 'Erro ao deletar páginas de evento.' });
    }
}

export const getEventSchema = async (req: Request, res: Response): Promise<Response> => {
    const { event_source } = req.params;
    console.log(`[getEventSchema] Buscando schema para event_source: ${event_source}`);
    const schema = loadSchema(event_source);
    if (!schema) {
        console.warn('[getEventSchema] Esquema de evento não encontrado.');
        return res.status(404).json({ message: 'Esquema de evento não encontrado.' });
    }
    return res.status(200).json({ schema });
};