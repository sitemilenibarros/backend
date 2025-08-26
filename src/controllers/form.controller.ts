import { Request, Response } from 'express';
import sequelize from '../config/db';
import EventFactory from '../models/events.model';
import FormFactory from '../models/form.model';

const Form = FormFactory(sequelize);
const Event = EventFactory(sequelize);

export const createForm = async (req: Request, res: Response) => {
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

        return res.status(201).json(form);
    } catch (error) {
        console.error('Erro ao salvar formulário:', error);
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

        return res.status(200).json({
            forms,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Erro ao listar formulários:', error);
        return res.status(500).json({ message: 'Erro ao listar formulários', error });
    }
};

export const getFormById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const form = await Form.findByPk(id);
        if (!form) {
            return res.status(404).json({ message: 'Formulário não encontrado.' });
        }
        return res.status(200).json(form);
    } catch (error) {
        console.error('Erro ao getFormById:', error);
        return res.status(500).json({ message: 'Erro ao buscar formulário', error });
    }
};

export const getFormsByEventId = async (req: Request, res: Response) => {
    try {
        const { eventId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const { rows: forms, count: total } = await Form.findAndCountAll({
            where: { event_id: eventId },
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        return res.status(200).json({
            forms,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Erro ao buscar formulários por evento:', error);
        return res.status(500).json({ message: 'Erro ao buscar formulários por evento', error });
    }
};
