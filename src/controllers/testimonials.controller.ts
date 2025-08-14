import { Request, Response } from 'express';
import TestimonialFactory from '../models/testimonials.model';
import sequelize from '../config/db';
import {Op} from "sequelize";

const Testimonial = TestimonialFactory(sequelize);

export const createTestimonial = async (req: Request, res: Response): Promise<Response> => {
    const { name, testimonial, photo } = req.body;

    try {
        const newTestimonial = await Testimonial.create({
            name,
            testimonial,
            photo,
        });

        return res.status(201).json({ message: 'Testemunho criado com sucesso!', testimonial: newTestimonial });
    } catch (err) {
        console.error('Erro ao criar testemunho:', err);
        return res.status(500).json({ message: 'Erro ao criar testemunho' });
    }
};

export const getAllTestimonials = async (req: Request, res: Response): Promise<Response> => {
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

        return res.status(200).json({
            testimonials,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error('Erro ao listar testemunhos:', err);
        return res.status(500).json({ message: 'Erro ao listar testemunhos' });
    }
};

export const getTestimonialById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;

    try {
        const testimonial = await Testimonial.findByPk(id);

        if (!testimonial) {
            return res.status(404).json({ message: 'Testemunho não encontrado' });
        }

        return res.status(200).json({ testimonial: testimonial });
    } catch (err) {
        console.error('Erro ao buscar testemunho:', err);
        return res.status(500).json({ message: 'Erro ao buscar testemunho' });
    }
};

export const updateTestimonial = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { name, testimonial, photo } = req.body;

    try {
        const testimonialToUpdate = await Testimonial.findByPk(id);

        if (!testimonialToUpdate) {
            return res.status(404).json({ message: 'Testemunho não encontrado' });
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (testimonial !== undefined) updateData.testimonial = testimonial;
        if (photo !== undefined) updateData.photo = photo;

        await testimonialToUpdate.update(updateData);

        return res.status(200).json({ message: 'Testemunho atualizado com sucesso!', testimonial: testimonialToUpdate });
    } catch (err) {
        console.error('Erro ao atualizar testemunho:', err);
        return res.status(500).json({ message: 'Erro ao atualizar testemunho' });
    }
};

export const deleteTestimonial = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;

    try {
        const testimonial = await Testimonial.findByPk(id);

        if (!testimonial) {
            return res.status(200).json({ message: 'Testemunho deletado com sucesso' });
        }

        await testimonial.destroy();
        return res.status(200).json({ message: 'Testemunho deletado com sucesso' });
    } catch (err) {
        console.error('Erro ao deletar testemunho:', err);
        return res.status(500).json({ message: 'Erro ao deletar testemunho' });
    }
};
