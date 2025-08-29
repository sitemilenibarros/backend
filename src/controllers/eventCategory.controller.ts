import { Request, Response } from 'express';
import EventCategoryFactory from '../models/eventCategory.model';
import sequelize from '../config/db';
import { logger } from '../utils/logger';

const EventCategory = EventCategoryFactory(sequelize);

export const createEventCategory = async (req: Request, res: Response): Promise<Response> => {
    logger.info('createEventCategory', 'Recebido:', req.body);
    try {
        const { name } = req.body;
        if (!name) {
            logger.warn('createEventCategory', 'Nome da categoria obrigatório.');
            return res.status(400).json({ message: 'O nome da categoria é obrigatório.' });
        }
        if (name.length > 100) {
            logger.warn('createEventCategory', 'Nome da categoria excede 100 caracteres.');
            return res.status(400).json({ message: 'O nome da categoria não pode ter mais de 100 caracteres.' });
        }
        const newCategory = await EventCategory.create({ name });
        logger.info('createEventCategory', 'Categoria criada com ID:', newCategory.id);
        return res.status(201).json(newCategory.toJSON());
    } catch (err) {
        logger.error('createEventCategory', 'Erro ao criar categoria:', err);
        return res.status(500).json({ message: 'Erro ao criar categoria.' });
    }
};

export const getAllEventCategories = async (_req: Request, res: Response): Promise<Response> => {
    logger.info('getAllEventCategories', 'Listando categorias');
    try {
        const categories = await EventCategory.findAll();
        const categoriesList = categories.map(c => c.toJSON());
        logger.info('getAllEventCategories', `Encontradas ${categoriesList.length} categorias.`);
        return res.status(200).json({ categories: categoriesList });
    } catch (err) {
        logger.error('getAllEventCategories', 'Erro ao listar categorias:', err);
        return res.status(500).json({ message: 'Erro ao listar categorias.' });
    }
};

export const getEventCategoryById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    logger.info('getEventCategoryById', 'Buscando categoria com ID:', id);
    try {
        const categoryFound = await EventCategory.findByPk(id);
        if (!categoryFound) {
            logger.warn('getEventCategoryById', 'Categoria não encontrada para ID:', id);
            return res.status(404).json({ message: 'Categoria não encontrada.' });
        }
        return res.status(200).json(categoryFound.toJSON());
    } catch (err) {
        logger.error('getEventCategoryById', 'Erro ao buscar categoria:', err);
        return res.status(500).json({ message: 'Erro ao buscar categoria.' });
    }
};

export const updateEventCategory = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const updates = req.body;
    logger.info('updateEventCategory', 'Atualizando categoria ID:', id);
    try {
        if (updates.name && updates.name.length > 100) {
            logger.warn('updateEventCategory', 'Nome da categoria excede 100 caracteres.');
            return res.status(400).json({ message: 'O nome da categoria não pode ter mais de 100 caracteres.' });
        }
        const [updated] = await EventCategory.update(updates, {
            where: { id },
        });
        if (updated === 0) {
            logger.warn('updateEventCategory', 'Categoria não encontrada para ID:', id);
            return res.status(404).json({ message: 'Categoria não encontrada.' });
        }
        const updatedCategory = await EventCategory.findByPk(id);
        logger.info('updateEventCategory', 'Categoria atualizada:', { id, name: updatedCategory?.name });
        return res.status(200).json(updatedCategory?.toJSON());
    } catch (err) {
        logger.error('updateEventCategory', 'Erro ao atualizar categoria:', err);
        return res.status(500).json({ message: 'Erro ao atualizar categoria.' });
    }
};

export const deleteEventCategory = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    logger.info('deleteEventCategory', 'Deletando categoria ID:', id);
    try {
        const deletedRows = await EventCategory.destroy({
            where: { id },
        });
        if (deletedRows === 0) {
            logger.warn('deleteEventCategory', 'Categoria não encontrada para ID:', id);
            return res.status(404).json({ message: 'Categoria não encontrada.' });
        }
        logger.info('deleteEventCategory', 'Categoria deletada com sucesso: ID', id);
        return res.status(200).json({ message: 'Categoria deletada com sucesso!' });
    } catch (err) {
        logger.error('deleteEventCategory', 'Erro ao deletar categoria:', err);
        return res.status(500).json({ message: 'Erro ao deletar categoria.' });
    }
};