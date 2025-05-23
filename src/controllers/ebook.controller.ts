import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import EbookFactory from '../models/ebook.model';
import sequelize from '../config/db';

const Ebook = EbookFactory(sequelize);

export const createEbook = async (req: Request, res: Response): Promise<Response> => {
    const { title, description, type, externalLink } = req.body;
    let filePath: string | undefined;

    if (type === 'free') {
        if (!req.file) {
            return res.status(400).json({ message: 'PDF obrigatório para ebooks gratuitos.' });
        }
        filePath = req.file.path;
    }

    try {
        const newEbook = await Ebook.create({ title, description, type, filePath, externalLink });
        return res.status(201).json({ message: 'Ebook criado com sucesso!', ebook: newEbook });
    } catch (error) {
        console.error('Erro ao criar ebook:', error);
        return res.status(500).json({ message: 'Erro ao criar ebook.' });
    }
};

export const getAllEbooks = async (_: Request, res: Response): Promise<Response> => {
    try {
        const ebooks = await Ebook.findAll();
        return res.status(200).json({ ebooks });
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
    const { title, description, type, externalLink } = req.body;
    let filePath: string | undefined;

    try {
        const ebook = await Ebook.findByPk(id);
        if (!ebook) {
            return res.status(404).json({ message: 'Ebook não encontrado.' });
        }

        if (req.file) {
            if (ebook.filePath) {
                fs.unlink(path.resolve(ebook.filePath), err => err && console.error(err));
            }
            filePath = req.file.path;
        }

        await ebook.update({ title, description, type, filePath, externalLink });
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

        if (ebook.filePath) {
            fs.unlink(path.resolve(ebook.filePath), err => err && console.error(err));
        }

        await ebook.destroy();
        await sequelize.query(`SELECT setval('ebooks_id_seq', (SELECT MAX(id) FROM ebooks));`);
        return res.status(200).json({ message: 'Ebook deletado com sucesso!' });
    } catch (error) {
        console.error('Erro ao deletar ebook:', error);
        return res.status(500).json({ message: 'Erro ao deletar ebook.' });
    }
};