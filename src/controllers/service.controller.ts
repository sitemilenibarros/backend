import { Request, Response } from 'express';
import ServiceFactory from '../models/services.model';
import sequelize from '../config/db';
import { Op } from 'sequelize';
const Service = ServiceFactory(sequelize);

export const createService = async (req: Request, res: Response): Promise<Response> => {
    const {
        titulo_servico,
        subtitulo_servico,
        imagem,
        descricao_servico,
        titulo_topicos_servico,
        topicos_servico,
        objetivo_servico,
        citacao_servico,
        cta_titulo,
        cta_subtitulo,
        cta_texto_botao,
        cta_link_botao
    } = req.body;

    try {
        const newService = await Service.create({
            titulo_servico,
            subtitulo_servico,
            imagem,
            descricao_servico,
            titulo_topicos_servico,
            topicos_servico,
            objetivo_servico,
            citacao_servico,
            cta_titulo,
            cta_subtitulo,
            cta_texto_botao,
            cta_link_botao
        });

        return res.status(201).json({ message: 'Serviço criado com sucesso!', service: newService });
    } catch (err) {
        console.error('Erro ao criar serviço:', err);
        return res.status(500).json({ message: 'Erro ao criar serviço' });
    }
};


export const getAllServices = async (req: Request, res: Response): Promise<Response> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const { name, description } = req.query;

        const where: any = {};
        if (name) {
            where.name = { [Op.iLike]: `%${name}%` };
        }
        if (description) {
            where.description = { [Op.iLike]: `%${description}%` };
        }

        const { rows: services, count: total } = await Service.findAndCountAll({
            where,
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            services,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
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

        return res.status(200).json({ service: service });
    } catch (err) {
        console.error('Erro ao buscar serviço:', err);
        return res.status(500).json({ message: 'Erro ao buscar serviço' });
    }
};


export const updateService = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const {
        titulo_servico,
        subtitulo_servico,
        imagem,
        descricao_servico,
        titulo_topicos_servico,
        topicos_servico,
        objetivo_servico,
        citacao_servico,
        cta_titulo,
        cta_subtitulo,
        cta_texto_botao,
        cta_link_botao
    } = req.body;

    try {
        const service = await Service.findByPk(id);

        if (!service) {
            return res.status(404).json({ message: 'Serviço não encontrado' });
        }

        const updateData: any = {};
        if (titulo_servico !== undefined) updateData.titulo_servico = titulo_servico;
        if (subtitulo_servico !== undefined) updateData.subtitulo_servico = subtitulo_servico;
        if (imagem !== undefined) updateData.imagem = imagem;
        if (descricao_servico !== undefined) updateData.descricao_servico = descricao_servico;
        if (titulo_topicos_servico !== undefined) updateData.titulo_topicos_servico = titulo_topicos_servico;
        if (topicos_servico !== undefined) updateData.topicos_servico = topicos_servico;
        if (objetivo_servico !== undefined) updateData.objetivo_servico = objetivo_servico;
        if (citacao_servico !== undefined) updateData.citacao_servico = citacao_servico;
        if (cta_titulo !== undefined) updateData.cta_titulo = cta_titulo;
        if (cta_subtitulo !== undefined) updateData.cta_subtitulo = cta_subtitulo;
        if (cta_texto_botao !== undefined) updateData.cta_texto_botao = cta_texto_botao;
        if (cta_link_botao !== undefined) updateData.cta_link_botao = cta_link_botao;

        await service.update(updateData);

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
            return res.status(200).json({ message: 'Serviço deletado com sucesso' });
        }

        await service.destroy();
        return res.status(200).json({ message: 'Serviço deletado com sucesso' });
    } catch (err) {
        console.error('Erro ao deletar serviço:', err);
        return res.status(500).json({ message: 'Erro ao deletar serviço' });
    }
};
