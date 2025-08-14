import { Request, Response } from 'express';
import EbookFactory from '../models/ebook.model';
import sequelize from '../config/db';
import { Op } from 'sequelize';

const Ebook = EbookFactory(sequelize);

export const createEbook = async (req: Request, res: Response): Promise<Response> => {
    const { title, description, type, filePath, externalLink } = req.body;

    if (type === 'free') {
        if (!filePath) {
            return res.status(400).json({ message: 'PDF obrigatório para ebooks gratuitos.' });
        }
    }

    try {
        const newEbook = await Ebook.create({ title, description, type, filePath, externalLink });
        return res.status(201).json({ message: 'Ebook criado com sucesso!', ebook: newEbook });
    } catch (error) {
        console.error('Erro ao criar ebook:', error);
        return res.status(500).json({ message: 'Erro ao criar ebook.' });
    }
};

export const getAllEbooks = async (req: Request, res: Response): Promise<Response> => {
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

        return res.status(200).json({
            ebooks: rows,
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('Erro ao listar ebooks:', error);
        return res.status(500).json({ message: 'Erro ao listar ebooks.' });
    }
};

export const getEbookById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try {
        const ebook = await Ebook.findByPk(id);
        if (!ebook) {
            return res.status(404).json({ message: 'Ebook não encontrado.' });
        }
        return res.status(200).json({ ebook });
    } catch (error) {
        console.error('Erro ao buscar ebook:', error);
        return res.status(500).json({ message: 'Erro ao buscar ebook.' });
    }
};

export const updateEbook = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { title, description, type, externalLink, filePath } = req.body;

    try {
        const ebook = await Ebook.findByPk(id);
        if (!ebook) {
            return res.status(404).json({ message: 'Ebook não encontrado.' });
        }

        await ebook.update({
            title: title ?? ebook.title,
            description: description ?? ebook.description,
            type: type ?? ebook.type,
            filePath: filePath ?? ebook.filePath,
            externalLink: externalLink ?? ebook.externalLink,
        });

        return res.status(200).json({ message: 'Ebook atualizado com sucesso!', ebook });
    } catch (error) {
        console.error('Erro ao atualizar ebook:', error);
        return res.status(500).json({ message: 'Erro ao atualizar ebook.' });
    }
};
export const deleteEbook = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try {
        const ebook = await Ebook.findByPk(id);
        if (!ebook) {
            return res.status(404).json({ message: 'Ebook não encontrado.' });
        }

        await ebook.destroy();
        return res.status(200).json({ message: 'Ebook deletado com sucesso!' });
    } catch (error) {
        console.error('Erro ao deletar ebook:', error);
        return res.status(500).json({ message: 'Erro ao deletar ebook.' });
    }
};