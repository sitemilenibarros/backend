import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ServiceFactory from '../models/services.model';
import sequelize from '../config/db';
const Service = ServiceFactory(sequelize);


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'assets/services');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

export const createService = async (req: Request, res: Response): Promise<Response> => {
    const { name, description } = req.body;
    const image = req.file?.path;

    if (!image) {
        return res.status(400).json({ message: 'Imagem é obrigatória' });
    }

    try {

        const newService = await Service.create({
            name,
            description,
            image,
        });

        const serviceWithImageUrl = {
            ...newService.toJSON(),
            image: `http://localhost:3000/assets/services/${path.basename(image)}`
        };

        return res.status(201).json({ message: 'Serviço criado com sucesso!', service: serviceWithImageUrl });
    } catch (err) {
        console.error('Erro ao criar serviço:', err);
        return res.status(500).json({ message: 'Erro ao criar serviço' });
    }
};


export const getAllServices = async (_: Request, res: Response): Promise<Response> => {
    try {
        const services = await Service.findAll();

        const servicesWithImageUrls = services.map(service => {
            return {
                ...service.toJSON(),
                image: `http://localhost:3000/assets/services/${path.basename(service.image)}`
            };
        });

        return res.status(200).json({ services: servicesWithImageUrls });
    } catch (err) {
        console.error('Erro ao listar serviços:', err);
        return res.status(500).json({ message: 'Erro ao listar serviços' });
    }
};


export const getServiceById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;

    try {
        const service = await Service.findByPk(id);

        if (!service) {
            return res.status(404).json({ message: 'Serviço não encontrado' });
        }

        const serviceWithImageUrl = {
            ...service.toJSON(),
            image: `http://localhost:3000/assets/services/${path.basename(service.image)}`
        };

        return res.status(200).json({ service: serviceWithImageUrl });
    } catch (err) {
        console.error('Erro ao buscar serviço:', err);
        return res.status(500).json({ message: 'Erro ao buscar serviço' });
    }
};


export const updateService = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { name, description, image } = req.body;

    try {
        const service = await Service.findByPk(id);

        if (!service) {
            return res.status(404).json({ message: 'Serviço não encontrado' });
        }


        if (service.image && image !== service.image) {
            const oldImagePath = path.resolve('assets', 'services', path.basename(service.image).replace(/\\/g, '/'));
            fs.unlink(oldImagePath, (err) => {
                if (err) {
                    console.error(`Erro ao excluir imagem antiga: ${oldImagePath}`, err);
                } else {
                    console.log(`Imagem antiga excluída com sucesso: ${oldImagePath}`);
                }
            });
        }


        await service.update({
            name,
            description,
            image,
        });

        return res.status(200).json({ message: 'Serviço atualizado com sucesso!', service });
    } catch (err) {
        console.error('Erro ao atualizar serviço:', err);
        return res.status(500).json({ message: 'Erro ao atualizar serviço' });
    }
};


export const deleteService = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;

    try {
        const service = await Service.findByPk(id);

        if (!service) {
            return res.status(404).json({ message: 'Serviço não encontrado' });
        }


        if (service.image) {
            const imagePath = path.resolve('assets', 'services', path.basename(service.image)); // Caminho da imagem
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error(`Erro ao excluir imagem: ${imagePath}`, err);
                }
            });
        }
        await service.destroy();
        return res.status(200).json({ message: 'Serviço deletado com sucesso' });
    } catch (err) {
        console.error('Erro ao deletar serviço:', err);
        return res.status(500).json({ message: 'Erro ao deletar serviço' });
    }
};
