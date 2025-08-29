import { Request, Response } from 'express';
import ServiceFactory from '../models/services.model';
import sequelize from '../config/db';
import { Op } from 'sequelize';
import { logger } from '../utils/logger';
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
    logger.info('createService', 'Recebido', req.body);
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
        logger.info('createService', 'Serviço criado', { id: newService.id });
        return res.status(201).json({ message: 'Serviço criado com sucesso!', service: newService });
    } catch (err) {
        logger.error('createService', 'Erro ao criar serviço', err);
        return res.status(500).json({ message: 'Erro ao criar serviço' });
    }
};

export const getAllServices = async (req: Request, res: Response): Promise<Response> => {
    logger.info('getAllServices', 'Listando serviços', req.query);
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const { name, description } = req.query;
        const where: any = {};
        if (name) where.name = { [Op.iLike]: `%${name}%` };
        if (description) where.description = { [Op.iLike]: `%${description}%` };
        const { rows: services, count: total } = await Service.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
        logger.info('getAllServices', 'Resultado', { qtd: services.length, total });
        return res.status(200).json({ services, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err) {
        logger.error('getAllServices', 'Erro ao listar serviços', err);
        return res.status(500).json({ message: 'Erro ao listar serviços' });
    }
};

export const getServiceById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    logger.info('getServiceById', 'Buscando serviço', id);
    try {
        const service = await Service.findByPk(id);
        if (!service) {
            logger.warn('getServiceById', 'Serviço não encontrado', id);
            return res.status(404).json({ message: 'Serviço não encontrado' });
        }
        logger.info('getServiceById', 'Serviço encontrado', { id: service.id });
        return res.status(200).json({ service });
    } catch (err) {
        logger.error('getServiceById', 'Erro ao buscar serviço', err);
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
    logger.info('updateService', 'Atualizando serviço', id);
    try {
        const service = await Service.findByPk(id);
        if (!service) {
            logger.warn('updateService', 'Serviço não encontrado', id);
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
        logger.info('updateService', 'Serviço atualizado', { id: service.id });
        return res.status(200).json({ message: 'Serviço atualizado com sucesso!', service });
    } catch (err) {
        logger.error('updateService', 'Erro ao atualizar serviço', err);
        return res.status(500).json({ message: 'Erro ao atualizar serviço' });
    }
};

export const deleteService = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    logger.info('deleteService', 'Deletando serviço', id);
    try {
        const service = await Service.findByPk(id);
        if (!service) {
            logger.warn('deleteService', 'Serviço não encontrado (idempotente)', id);
            return res.status(200).json({ message: 'Serviço deletado com sucesso' });
        }
        await service.destroy();
        logger.info('deleteService', 'Serviço deletado', id);
        return res.status(200).json({ message: 'Serviço deletado com sucesso' });
    } catch (err) {
        logger.error('deleteService', 'Erro ao deletar serviço', err);
        return res.status(500).json({ message: 'Erro ao deletar serviço' });
    }
};
