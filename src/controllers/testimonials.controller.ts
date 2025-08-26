import { Request, Response } from 'express';
import TestimonialFactory from '../models/testimonials.model';
import sequelize from '../config/db';
import {Op} from "sequelize";

const Testimonial = TestimonialFactory(sequelize);

export const createTestimonial = async (req: Request, res: Response): Promise<Response> => {
    const { name, testimonial, photo } = req.body;
    console.log(`[createTestimonial] Recebido: name=${name}, testimonial=${testimonial}, photo=${photo}`);
    try {
        const newTestimonial = await Testimonial.create({
            name,
            testimonial,
            photo,
        });
        console.log(`[createTestimonial] Testemunho criado com ID: ${newTestimonial.id}`);
        return res.status(201).json({ message: 'Testemunho criado com sucesso!', testimonial: newTestimonial });
    } catch (err) {
        console.error('[createTestimonial] Erro ao criar testemunho:', err);
        return res.status(500).json({ message: 'Erro ao criar testemunho' });
    }
};

export const getAllTestimonials = async (req: Request, res: Response): Promise<Response> => {
    console.log(`[getAllTestimonials] Query:`, req.query);
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const { name, testimonial } = req.query;

        const where: any = {};
        if (name) {
            where.name = { [Op.iLike]: `%${name}%` };
        }
        if (testimonial) {
            where.testimonial = { [Op.iLike]: `%${testimonial}%` };
        }

        const { rows: testimonials, count: total } = await Testimonial.findAndCountAll({
            where,
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });
        console.log(`[getAllTestimonials] Retornando ${testimonials.length} testemunhos, total: ${total}`);
        return res.status(200).json({
            testimonials,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error('[getAllTestimonials] Erro ao listar testemunhos:', err);
        return res.status(500).json({ message: 'Erro ao listar testemunhos' });
    }
};

export const getTestimonialById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    console.log(`[getTestimonialById] Buscando testemunho com ID: ${id}`);
    try {
        const testimonial = await Testimonial.findByPk(id);
        if (!testimonial) {
            console.warn(`[getTestimonialById] Testemunho não encontrado para ID: ${id}`);
            return res.status(404).json({ message: 'Testemunho não encontrado' });
        }

        return res.status(200).json({ testimonial: testimonial });
    } catch (err) {
        console.error('[getTestimonialById] Erro ao buscar testemunho:', err);
        return res.status(500).json({ message: 'Erro ao buscar testemunho' });
    }
};

export const updateTestimonial = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { name, testimonial, photo } = req.body;
    console.log(`[updateTestimonial] Atualizando ID: ${id} com name=${name}, testimonial=${testimonial}, photo=${photo}`);
    try {
        const testimonialToUpdate = await Testimonial.findByPk(id);
        if (!testimonialToUpdate) {
            console.warn(`[updateTestimonial] Testemunho não encontrado para ID: ${id}`);
            return res.status(404).json({ message: 'Testemunho não encontrado' });
        }
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (testimonial !== undefined) updateData.testimonial = testimonial;
        if (photo !== undefined) updateData.photo = photo;
        await testimonialToUpdate.update(updateData);
        console.log(`[updateTestimonial] Testemunho atualizado:`, testimonialToUpdate);
        return res.status(200).json({ message: 'Testemunho atualizado com sucesso!', testimonial: testimonialToUpdate });
    } catch (err) {
        console.error('[updateTestimonial] Erro ao atualizar testemunho:', err);
        return res.status(500).json({ message: 'Erro ao atualizar testemunho' });
    }
};

export const deleteTestimonial = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    console.log(`[deleteTestimonial] Deletando testemunho com ID: ${id}`);
    try {
        const testimonial = await Testimonial.findByPk(id);
        if (!testimonial) {
            console.warn(`[deleteTestimonial] Testemunho não encontrado para ID: ${id}`);
            return res.status(200).json({ message: 'Testemunho deletado com sucesso' });
        }
        await testimonial.destroy();
        console.log(`[deleteTestimonial] Testemunho deletado com sucesso: ID ${id}`);
        return res.status(200).json({ message: 'Testemunho deletado com sucesso' });
    } catch (err) {
        console.error('[deleteTestimonial] Erro ao deletar testemunho:', err);
        return res.status(500).json({ message: 'Erro ao deletar testemunho' });
    }
};
