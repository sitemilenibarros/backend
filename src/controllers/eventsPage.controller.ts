import { Request, Response } from 'express';
import EventPageFactory from '../models/eventsPage.model';
import sequelize from '../config/db';
import { hydrateEventWithSchema, validateEventPageData, loadSchema } from '../utils/schema_handler';
import { logger } from '../utils/logger';

const EventPage = EventPageFactory(sequelize);

export const createEventPage = async (req: Request, res: Response): Promise<Response> => {
    const { event_id, event_source, content } = req.body;
    logger.info('createEventPage', 'Recebido', req.body);
    if (!event_id || !event_source || !content) {
        logger.warn('createEventPage', 'Campos obrigatórios ausentes');
        return res.status(400).json({ message: 'Os campos event_id, event_source e content são obrigatórios.' });
    }
    const validation = validateEventPageData(event_source, content);
    if (!validation.isValid) {
        logger.warn('createEventPage', 'Erro de validação', validation.errors);
        return res.status(400).json({ message: 'Erro de validação', errors: validation.errors });
    }
    try {
        const newEventPage = await EventPage.create({
            event_id,
            event_source,
            content,
        });
        logger.info('createEventPage', 'Página criada', { event_id, event_source });
        return res.status(201).json(newEventPage.toJSON());
    } catch (err: any) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            logger.warn('createEventPage', 'Chave já existe', event_source);
            return res.status(409).json({ message: `A chave '${event_source}' já existe.` });
        }
        logger.error('createEventPage', 'Erro ao criar página de evento', err);
        return res.status(500).json({ message: 'Erro ao criar página de evento.' });
    }
};

export const getAllEventPages = async (_req: Request, res: Response): Promise<Response> => {
    logger.info('getAllEventPages', 'Listando páginas de evento');
    try {
        const allEventPages = await EventPage.findAll();
        const pagesList = allEventPages.map(page => page.toJSON());
        logger.info('getAllEventPages', 'Total encontrado', pagesList.length);
        return res.status(200).json({ pages: pagesList });
    } catch (err) {
        logger.error('getAllEventPages', 'Erro ao listar páginas de evento', err);
        return res.status(500).json({ message: 'Erro ao listar páginas de evento.' });
    }
};

export const getEventPagesByEventId = async (req: Request, res: Response): Promise<Response> => {
    const { event_id } = req.params;
    logger.info('getEventPagesByEventId', 'Buscando páginas', event_id);
    try {
        const eventPagesFound = await EventPage.findAll({
            where: { event_id },
            order: [['event_source', 'ASC']]
        });
        if (eventPagesFound.length === 0) {
            logger.warn('getEventPagesByEventId', 'Nenhuma página encontrada', event_id);
            return res.status(404).json({ message: 'Nenhuma página de evento encontrada para este ID.' });
        }
        const pages = eventPagesFound.map(page => page.toJSON());
        logger.info('getEventPagesByEventId', 'Total páginas', pages.length);
        return res.status(200).json({ event_pages: pages });
    } catch (err) {
        logger.error('getEventPagesByEventId', 'Erro ao buscar páginas de evento por ID', err);
        return res.status(500).json({ message: 'Erro ao buscar páginas de evento por ID.' });
    }
};

export const getEventPageBySource = async (req: Request, res: Response): Promise<Response> => {
    const { event_id, event_source } = req.params;
    logger.info('getEventPageBySource', 'Buscando página', { event_id, event_source });
    try {
        const pageFound = await EventPage.findOne({
            where: { event_id, event_source },
        });
        if (!pageFound) {
            logger.warn('getEventPageBySource', 'Página não encontrada', { event_id, event_source });
            return res.status(404).json({ message: 'Página de evento não encontrada para este evento.' });
        }
        const pageContent = pageFound.toJSON().content;
        const hydratedPage = hydrateEventWithSchema(event_source, pageContent);
        return res.status(200).json(hydratedPage);
    } catch (err) {
        logger.error('getEventPageBySource', 'Erro ao buscar página de evento', err);
        return res.status(500).json({ message: 'Erro ao buscar página de evento.' });
    }
};

export const updateEventPage = async (req: Request, res: Response): Promise<Response> => {
    const { event_id, event_source } = req.params;
    const { ...contentData } = req.body;
    logger.info('updateEventPage', 'Atualizando página', { event_id, event_source });
    const validation = validateEventPageData(event_source, contentData);
    if (!validation.isValid) {
        logger.warn('updateEventPage', 'Erro de validação', validation.errors);
        return res.status(400).json({ message: 'Erro de validação', errors: validation.errors });
    }
    try {
        const [updated] = await EventPage.update({ content: contentData }, {
            where: { event_id, event_source }
        });
        if (updated === 0) {
            logger.warn('updateEventPage', 'Página não encontrada', { event_id, event_source });
            return res.status(404).json({ message: 'Página de evento não encontrada para este evento.' });
        }
        const updatedPage = await EventPage.findOne({ where: { event_id, event_source } });
        logger.info('updateEventPage', 'Página atualizada', { event_id, event_source });
        return res.status(200).json(updatedPage?.toJSON());
    } catch (err) {
        logger.error('updateEventPage', 'Erro ao atualizar página de evento', err);
        return res.status(500).json({ message: 'Erro ao atualizar página de evento.' });
    }
};

export const partialUpdateEventPage = async (req: Request, res: Response): Promise<Response> => {
    const { event_id, event_source } = req.params;
    const updates = req.body;
    logger.info('partialUpdateEventPage', 'Atualização parcial', { event_id, event_source });
    try {
        const page = await EventPage.findOne({
            where: { event_id, event_source },
        });
        if (!page) {
            logger.warn('partialUpdateEventPage', 'Página não encontrada', { event_id, event_source });
            return res.status(404).json({ message: 'Página de evento não encontrada para este evento.' });
        }
        const updatedContentData = {
            ...page.content as any,
            ...updates,
        };
        const validation = validateEventPageData(event_source, updatedContentData);
        if (!validation.isValid) {
            logger.warn('partialUpdateEventPage', 'Erro de validação', validation.errors);
            return res.status(400).json({ message: 'Erro de validação', errors: validation.errors });
        }
        const updatedPage = await page.update({ content: updatedContentData });
        logger.info('partialUpdateEventPage', 'Página parcialmente atualizada', { event_id, event_source });
        return res.status(200).json(updatedPage.toJSON());
    } catch (err) {
        logger.error('partialUpdateEventPage', 'Erro ao atualizar página de evento parcialmente', err);
        return res.status(500).json({ message: 'Erro ao atualizar página de evento parcialmente.' });
    }
};

export const deleteEventPage = async (req: Request, res: Response): Promise<Response> => {
    const { event_id, event_source } = req.params;
    logger.info('deleteEventPage', 'Deletando página', { event_id, event_source });
    try {
        const deletedRows = await EventPage.destroy({
            where: { event_id, event_source },
        });
        if (deletedRows === 0) {
            logger.warn('deleteEventPage', 'Página não encontrada', { event_id, event_source });
            return res.status(404).json({ message: 'Página de evento não encontrada para este evento.' });
        }
        logger.info('deleteEventPage', 'Página deletada', { event_id, event_source });
        return res.status(200).json({ message: 'Página de evento deletada com sucesso!' });
    } catch (err) {
        logger.error('deleteEventPage', 'Erro ao deletar página de evento', err);
        return res.status(500).json({ message: 'Erro ao deletar página de evento.' });
    }
};

export const deleteEventPagesByEventId = async (req: Request, res: Response): Promise<Response> => {
    const { event_id } = req.params;
    logger.info('deleteEventPagesByEventId', 'Deletando todas as páginas', event_id);
    try {
        const deletedRows = await EventPage.destroy({
            where: { event_id },
        });
        if (deletedRows === 0) {
            logger.warn('deleteEventPagesByEventId', 'Nenhuma página encontrada', event_id);
            return res.status(404).json({ message: 'Nenhuma página de evento encontrada para este ID.' });
        }
        logger.info('deleteEventPagesByEventId', 'Todas as páginas deletadas', event_id);
        return res.status(200).json({ message: 'Páginas de evento deletadas com sucesso!' });
    } catch (err) {
        logger.error('deleteEventPagesByEventId', 'Erro ao deletar páginas de evento', err);
        return res.status(500).json({ message: 'Erro ao deletar páginas de evento.' });
    }
};

export const getEventSchema = async (req: Request, res: Response): Promise<Response> => {
    const { event_source } = req.params;
    logger.info('getEventSchema', 'Buscando schema', event_source);
    const schema = loadSchema(event_source);
    if (!schema) {
        logger.warn('getEventSchema', 'Schema não encontrado', event_source);
        return res.status(404).json({ message: 'Esquema de evento não encontrado.' });
    }
    return res.status(200).json({ schema });
};