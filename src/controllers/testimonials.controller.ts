import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import TestimonialFactory from '../models/testimonials.model';
import sequelize from '../config/db';
import fs from 'fs';

const Testimonial = TestimonialFactory(sequelize);


const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, 'assets/testimonials');
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});


export const createTestimonial = async (req: Request, res: Response): Promise<Response> => {
    const { name, testimonial } = req.body;
    const photo = req.file?.path;

    try {
        const newTestimonial = await Testimonial.create({
            name,
            testimonial,
            photo,
        });

        const testimonialWithImageUrl = {
            ...newTestimonial.toJSON(),
            photo: photo ? `http://localhost:3000/assets/testimonials/${path.basename(photo)}` : null
        };

        return res.status(201).json({ message: 'Testemunho criado com sucesso!', testimonial: testimonialWithImageUrl });
    } catch (err) {
        console.error('Erro ao criar testemunho:', err);
        return res.status(500).json({ message: 'Erro ao criar testemunho' });
    }
};

export const getAllTestimonials = async (_: Request, res: Response): Promise<Response> => {
    try {
        const testimonials = await Testimonial.findAll();


        const testimonialsWithImageUrls = testimonials.map(testimonial => {
            return {
                ...testimonial.toJSON(),
                photo: testimonial.photo ? `http://localhost:3000/assets/testimonials/${path.basename(testimonial.photo)}` : null
            };
        });

        return res.status(200).json({ testimonials: testimonialsWithImageUrls });
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

        const testimonialWithImageUrl = {
            ...testimonial.toJSON(),
            photo: testimonial.photo ? `http://localhost:3000/assets/testimonials/${path.basename(testimonial.photo)}` : null
        };

        return res.status(200).json({ testimonial: testimonialWithImageUrl });
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

        if (photo && testimonialToUpdate.photo) {
            const oldPhotoPath = path.resolve('assets', 'testimonials', path.basename(testimonialToUpdate.photo)); // Caminho da foto antiga
            fs.unlink(oldPhotoPath, (err) => {
                if (err) {
                    console.error(`Erro ao excluir foto antiga: ${oldPhotoPath}`, err);
                }
            });
        }

        await testimonialToUpdate.update({
            name,
            testimonial,
            photo,
        });

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
            return res.status(404).json({ message: 'Testemunho não encontrado' });
        }

        if (testimonial.photo) {
            const photoPath = path.resolve('assets', 'testimonials', path.basename(testimonial.photo)); // Caminho da foto
            fs.unlink(photoPath, (err) => {
                if (err) {
                    console.error(`Erro ao excluir foto: ${photoPath}`, err);
                }
            });
        }

        await testimonial.destroy();
        return res.status(200).json({ message: 'Testemunho deletado com sucesso' });
    } catch (err) {
        console.error('Erro ao deletar testemunho:', err);
        return res.status(500).json({ message: 'Erro ao deletar testemunho' });
    }
};
