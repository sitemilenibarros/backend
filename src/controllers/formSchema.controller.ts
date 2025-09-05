import { Request, Response } from 'express';
import sequelize from '../config/db';
import FormSchemaFactory from '../models/formSchema.model';
import { logger } from '../utils/logger';
import { validateFormSchema, exampleSchemas } from '../utils/schema_handler';

const FormSchema = FormSchemaFactory(sequelize);

export const createOrUpdateFormSchema = async (req: Request, res: Response) => {
    logger.info('createOrUpdateFormSchema', 'Body recebido na requisição', req.body);
    const { eventId, modality } = req.params;
    let schema_json = req.body;

    if (typeof schema_json === 'string') {
        try {
            schema_json = JSON.parse(schema_json);
            logger.debug('createOrUpdateFormSchema', 'Schema_json convertido de string para array', schema_json);
        } catch (e) {
            logger.error('createOrUpdateFormSchema', 'Erro ao fazer parse do schema_json', e);
            return res.status(400).json({ message: 'Schema inválido: não é um array nem um JSON válido.' });
        }
    }

    const { valid, errors } = validateFormSchema(schema_json);
    if (!valid) {
        logger.warn('createOrUpdateFormSchema', 'Schema inválido', { eventId, modality, errors });
        return res.status(400).json({ message: 'Schema inválido', errors });
    }
    try {
        let formSchema = await FormSchema.findOne({ where: { event_id: eventId, modality } });
        if (formSchema) {
            await formSchema.update({ schema_json });
            logger.info('createOrUpdateFormSchema', 'Schema atualizado', { eventId, modality });
        } else {
            formSchema = await FormSchema.create({ event_id: eventId, modality, schema_json });
            logger.info('createOrUpdateFormSchema', 'Schema criado', { eventId, modality });
        }
        return res.status(200).json(formSchema);
    } catch (error) {
        logger.error('createOrUpdateFormSchema', 'Erro ao salvar schema', error);
        return res.status(500).json({ message: 'Erro ao salvar schema', error });
    }
};

export const getFormSchemaByEventId = async (req: Request, res: Response) => {
    const { eventId } = req.params;
    try {
        const formSchemas = await FormSchema.findAll({ where: { event_id: eventId } });
        if (!formSchemas || formSchemas.length === 0) {
            logger.warn('getFormSchemaByEventId', 'Nenhum schema encontrado', eventId);
            return res.status(404).json({ message: 'Nenhum schema encontrado para este eventId.' });
        }
        return res.status(200).json(formSchemas);
    } catch (error) {
        logger.error('getFormSchemaByEventId', 'Erro ao buscar schemas', error);
        return res.status(500).json({ message: 'Erro ao buscar schemas', error });
    }
};

export const getFormSchemaByEventIdAndModality = async (req: Request, res: Response) => {
    const { eventId, modality } = req.params;
    try {
        const formSchema = await FormSchema.findOne({ where: { event_id: eventId, modality } });
        if (!formSchema) {
            logger.warn('getFormSchemaByEventIdAndModality', 'Nenhum schema encontrado', { eventId, modality });
            return res.status(404).json({ message: `Nenhum schema encontrado para eventId ${eventId} e modalidade ${modality}.` });
        }
        return res.status(200).json(formSchema);
    } catch (error) {
        logger.error('getFormSchemaByEventIdAndModality', 'Erro ao buscar schema', error);
        return res.status(500).json({ message: 'Erro ao buscar schema', error });
    }
};

export const getFormSchemaExamples = async (req: Request, res: Response) => {
    return res.status(200).json({ examples: exampleSchemas });
};
