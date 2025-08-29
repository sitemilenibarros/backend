import { Request, Response } from 'express';
import TestimonialFactory from '../models/testimonials.model';
import sequelize from '../config/db';
import {Op} from "sequelize";
import { logger } from '../utils/logger';

const Testimonial = TestimonialFactory(sequelize);

export const createTestimonial = async (req: Request, res: Response): Promise<Response> => {
    const { name, testimonial, photo } = req.body;
    logger.info('createTestimonial', 'Recebido', { name, testimonial, photo });
    try {
        const newTestimonial = await Testimonial.create({ name, testimonial, photo });
        logger.info('createTestimonial', 'Criado', { id: newTestimonial.id });
        return res.status(201).json({ message: 'Testemunho criado com sucesso!', testimonial: newTestimonial });
    } catch (err) {
        logger.error('createTestimonial', 'Erro ao criar', err);
        return res.status(500).json({ message: 'Erro ao criar testemunho' });
    }
};

export const getAllTestimonials = async (req: Request, res: Response): Promise<Response> => {
    logger.info('getAllTestimonials', 'Query', req.query);
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const { name, testimonial } = req.query;
        const where: any = {};
        if (name) where.name = { [Op.iLike]: `%${name}%` };
        if (testimonial) where.testimonial = { [Op.iLike]: `%${testimonial}%` };
        const { rows: testimonials, count: total } = await Testimonial.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
        logger.info('getAllTestimonials', 'Resultado', { qtd: testimonials.length, total });
        return res.status(200).json({ testimonials, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err) {
        logger.error('getAllTestimonials', 'Erro ao listar', err);
        return res.status(500).json({ message: 'Erro ao listar testemunhos' });
    }
};

export const getTestimonialById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    logger.info('getTestimonialById', 'Buscando', id);
    try {
        const testimonial = await Testimonial.findByPk(id);
        if (!testimonial) {
            logger.warn('getTestimonialById', 'Não encontrado', id);
            return res.status(404).json({ message: 'Testemunho não encontrado' });
        }
        return res.status(200).json({ testimonial });
    } catch (err) {
        logger.error('getTestimonialById', 'Erro ao buscar', err);
        return res.status(500).json({ message: 'Erro ao buscar testemunho' });
    }
};

export const updateTestimonial = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { name, testimonial, photo } = req.body;
    logger.info('updateTestimonial', 'Atualizando', { id, name, testimonial, photo });
    try {
        const testimonialToUpdate = await Testimonial.findByPk(id);
        if (!testimonialToUpdate) {
            logger.warn('updateTestimonial', 'Não encontrado', id);
            return res.status(404).json({ message: 'Testemunho não encontrado' });
        }
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (testimonial !== undefined) updateData.testimonial = testimonial;
        if (photo !== undefined) updateData.photo = photo;
        await testimonialToUpdate.update(updateData);
        logger.info('updateTestimonial', 'Atualizado', { id: testimonialToUpdate.id });
        return res.status(200).json({ message: 'Testemunho atualizado com sucesso!', testimonial: testimonialToUpdate });
    } catch (err) {
        logger.error('updateTestimonial', 'Erro ao atualizar', err);
        return res.status(500).json({ message: 'Erro ao atualizar testemunho' });
    }
};

export const deleteTestimonial = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    logger.info('deleteTestimonial', 'Deletando', id);
    try {
        const testimonial = await Testimonial.findByPk(id);
        if (!testimonial) {
            logger.warn('deleteTestimonial', 'Não encontrado (idempotente)', id);
            return res.status(200).json({ message: 'Testemunho deletado com sucesso' });
        }
        await testimonial.destroy();
        logger.info('deleteTestimonial', 'Deletado', id);
        return res.status(200).json({ message: 'Testemunho deletado com sucesso' });
    } catch (err) {
        logger.error('deleteTestimonial', 'Erro ao deletar', err);
        return res.status(500).json({ message: 'Erro ao deletar testemunho' });
    }
};
