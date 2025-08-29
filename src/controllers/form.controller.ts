import { Request, Response } from 'express';
import sequelize from '../config/db';
import EventFactory from '../models/events.model';
import FormFactory from '../models/form.model';
import { logger } from '../utils/logger';

const Form = FormFactory(sequelize);
const Event = EventFactory(sequelize);

export const createForm = async (req: Request, res: Response) => {
    logger.info('createForm', 'Recebido', req.body);
    try {
        const { eventId } = req.params;
        const form_data = req.body;
        const form = await Form.create({
            event_id: eventId,
            form_data
        });
        logger.info('createForm', 'Formulário criado', { id: form.id, eventId });
        return res.status(201).json(form);
    } catch (error) {
        logger.error('createForm', 'Erro ao salvar formulário', error);
        return res.status(500).json({ message: 'Erro ao salvar formulário', error });
    }
};

export const listForms = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const { rows: forms, count: total } = await Form.findAndCountAll({
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });
        logger.info('listForms', 'Listagem', { qtd: forms.length, total, page });
        return res.status(200).json({
            forms,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        logger.error('listForms', 'Erro ao listar formulários', error);
        return res.status(500).json({ message: 'Erro ao listar formulários', error });
    }
};

export const getFormById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const form = await Form.findByPk(id);
        if (!form) {
            logger.warn('getFormById', 'Formulário não encontrado', id);
            return res.status(404).json({ message: 'Formulário não encontrado.' });
        }
        return res.status(200).json(form);
    } catch (error) {
        logger.error('getFormById', 'Erro ao buscar formulário', error);
        return res.status(500).json({ message: 'Erro ao buscar formulário', error });
    }
};

export const getFormsByEventId = async (req: Request, res: Response) => {
    const { eventId } = req.params;
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const { rows: forms, count: total } = await Form.findAndCountAll({
            where: { event_id: eventId },
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });
        logger.info('getFormsByEventId', 'Listagem por evento', { eventId, qtd: forms.length, total, page });
        return res.status(200).json({
            forms,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        logger.error('getFormsByEventId', 'Erro ao buscar formulários por evento', error);
        return res.status(500).json({ message: 'Erro ao buscar formulários por evento', error });
    }
};
