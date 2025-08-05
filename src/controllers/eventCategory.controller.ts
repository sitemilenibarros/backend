import { Request, Response } from 'express';
import EventCategoryFactory from '../models/eventCategory.model';
import sequelize from '../config/db';

const EventCategory = EventCategoryFactory(sequelize);

export const createEventCategory = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'O nome da categoria é obrigatório.' });
        }
        if (name.length > 100) {
            return res.status(400).json({ message: 'O nome da categoria não pode ter mais de 100 caracteres.' });
        }

        const newCategory = await EventCategory.create({ name });
        return res.status(201).json(newCategory.toJSON());
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao criar categoria.' });
    }
};

export const getAllEventCategories = async (_req: Request, res: Response): Promise<Response> => {
    try {
        const categories = await EventCategory.findAll();
        const categoriesList = categories.map(c => c.toJSON());
        return res.status(200).json({ categories: categoriesList });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao listar categorias.' });
    }
};

export const getEventCategoryById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try {
        const categoryFound = await EventCategory.findByPk(id);
        if (!categoryFound) {
            return res.status(404).json({ message: 'Categoria não encontrada.' });
        }
        return res.status(200).json(categoryFound.toJSON());
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao buscar categoria.' });
    }
};

export const updateEventCategory = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const updates = req.body;

    try {
        if (updates.name && updates.name.length > 100) {
            return res.status(400).json({ message: 'O nome da categoria não pode ter mais de 100 caracteres.' });
        }

        const [updated] = await EventCategory.update(updates, {
            where: { id },
        });

        if (updated === 0) {
            return res.status(404).json({ message: 'Categoria não encontrada.' });
        }

        const updatedCategory = await EventCategory.findByPk(id);
        return res.status(200).json(updatedCategory?.toJSON());
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao atualizar categoria.' });
    }
};

export const deleteEventCategory = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try {
        const deletedRows = await EventCategory.destroy({
            where: { id },
        });

        if (deletedRows === 0) {
            return res.status(404).json({ message: 'Categoria não encontrada.' });
        }

        return res.status(200).json({ message: 'Categoria deletada com sucesso!' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao deletar categoria.' });
    }
};