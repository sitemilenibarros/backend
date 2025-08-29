import { Request, Response } from 'express';
import EbookFactory from '../models/ebook.model';
import sequelize from '../config/db';
import { Op } from 'sequelize';
import { logger } from '../utils/logger';

const Ebook = EbookFactory(sequelize);

export const createEbook = async (req: Request, res: Response): Promise<Response> => {
    const { title, description, type, filePath, externalLink } = req.body;
    logger.info('createEbook', 'Recebido:', { title, type, filePath, externalLink });
    if (type === 'free') {
        if (!filePath) {
            logger.warn('createEbook', 'PDF obrigatório para ebooks gratuitos.');
            return res.status(400).json({ message: 'PDF obrigatório para ebooks gratuitos.' });
        }
    }
    try {
        const newEbook = await Ebook.create({ title, description, type, filePath, externalLink });
        logger.info('createEbook', 'Ebook criado com ID:', newEbook.id);
        return res.status(201).json({ message: 'Ebook criado com sucesso!', ebook: newEbook });
    } catch (error) {
        logger.error('createEbook', 'Erro ao criar ebook:', error);
        return res.status(500).json({ message: 'Erro ao criar ebook.' });
    }
};

export const getAllEbooks = async (req: Request, res: Response): Promise<Response> => {
    logger.info('getAllEbooks', 'Listando ebooks', req.query);
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const filters: any = {};
        if (req.query.title) {
            filters.title = { [Op.iLike]: `%${req.query.title}%` };
        }
        if (req.query.type) {
            filters.type = req.query.type;
        }
        const { count, rows } = await Ebook.findAndCountAll({
            where: filters,
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });
        logger.info('getAllEbooks', `Retornando ${rows.length} ebooks, total: ${count}`);
        return res.status(200).json({
            ebooks: rows,
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        logger.error('getAllEbooks', 'Erro ao listar ebooks:', error);
        return res.status(500).json({ message: 'Erro ao listar ebooks.' });
    }
};

export const getEbookById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    logger.info('getEbookById', 'Buscando ebook com ID:', id);
    try {
        const ebook = await Ebook.findByPk(id);
        if (!ebook) {
            logger.warn('getEbookById', 'Ebook não encontrado para ID:', id);
            return res.status(404).json({ message: 'Ebook não encontrado.' });
        }
        return res.status(200).json({ ebook });
    } catch (error) {
        logger.error('getEbookById', 'Erro ao buscar ebook:', error);
        return res.status(500).json({ message: 'Erro ao buscar ebook.' });
    }
};

export const updateEbook = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { title, description, type, externalLink, filePath } = req.body;
    logger.info('updateEbook', 'Atualizando ebook ID:', id);
    try {
        const ebook = await Ebook.findByPk(id);
        if (!ebook) {
            logger.warn('updateEbook', 'Ebook não encontrado para ID:', id);
            return res.status(404).json({ message: 'Ebook não encontrado.' });
        }
        await ebook.update({
            title: title ?? ebook.title,
            description: description ?? ebook.description,
            type: type ?? ebook.type,
            filePath: filePath ?? ebook.filePath,
            externalLink: externalLink ?? ebook.externalLink,
        });
        logger.info('updateEbook', 'Ebook atualizado:', { id: ebook.id, title: ebook.title });
        return res.status(200).json({ message: 'Ebook atualizado com sucesso!', ebook });
    } catch (error) {
        logger.error('updateEbook', 'Erro ao atualizar ebook:', error);
        return res.status(500).json({ message: 'Erro ao atualizar ebook.' });
    }
};

export const deleteEbook = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    logger.info('deleteEbook', 'Deletando ebook ID:', id);
    try {
        const ebook = await Ebook.findByPk(id);
        if (!ebook) {
            logger.warn('deleteEbook', 'Ebook não encontrado para ID:', id);
            return res.status(404).json({ message: 'Ebook não encontrado.' });
        }
        await ebook.destroy();
        logger.info('deleteEbook', 'Ebook deletado com sucesso: ID', id);
        return res.status(200).json({ message: 'Ebook deletado com sucesso!' });
    } catch (error) {
        logger.error('deleteEbook', 'Erro ao deletar ebook:', error);
        return res.status(500).json({ message: 'Erro ao deletar ebook.' });
    }
};