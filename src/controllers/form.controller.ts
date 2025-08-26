import { Request, Response } from 'express';
import sequelize from '../config/db';
import EventFactory from '../models/events.model';
import FormFactory from '../models/form.model';

const Form = FormFactory(sequelize);
const Event = EventFactory(sequelize);

export const createForm = async (req: Request, res: Response) => {
    console.log('[createForm] Recebido:', req.body);
    try {
        const { eventId } = req.params;
        const form_data = req.body;

        // Verifica se o evento existe
        // const event = await Event.findByPk(eventId);
        // if (!event) {
        //     return res.status(404).json({ message: 'Evento não encontrado.' });
        // }

        const form = await Form.create({
            event_id: eventId,
            form_data
        });
        console.log(`[createForm] Formulário criado com ID: ${form.id}`);
        return res.status(201).json(form);
    } catch (error) {
        console.error('[createForm] Erro ao salvar formulário:', error);
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
        console.log(`[listForms] Retornando ${forms.length} formulários, total: ${total}`);
        return res.status(200).json({
            forms,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('[listForms] Erro ao listar formulários:', error);
        return res.status(500).json({ message: 'Erro ao listar formulários', error });
    }
};

export const getFormById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const form = await Form.findByPk(id);
        if (!form) {
            console.warn(`[getFormById] Formulário não encontrado para ID: ${id}`);
            return res.status(404).json({ message: 'Formulário não encontrado.' });
        }
        return res.status(200).json(form);
    } catch (error) {
        console.error('[getFormById] Erro ao buscar formulário:', error);
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
        console.log(`[getFormsByEventId] Retornando ${forms.length} formulários para evento ID: ${eventId}, total: ${total}`);
        return res.status(200).json({
            forms,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('[getFormsByEventId] Erro ao buscar formulários por evento:', error);
        return res.status(500).json({ message: 'Erro ao buscar formulários por evento', error });
    }
};
