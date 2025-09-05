import { Request, Response } from 'express';
import sequelize from '../config/db';
import FormSchemaFactory from '../models/formSchema.model';
import { logger } from '../utils/logger';
import { validateFormSchema, exampleSchemas } from '../utils/schema_handler';

const FormSchema = FormSchemaFactory(sequelize);

export const createOrUpdateFormSchema = async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const schema_json = req.body;

    const { valid, errors } = validateFormSchema(schema_json);
    if (!valid) {
        logger.warn('createOrUpdateFormSchema', 'Schema inválido', { eventId, errors });
        return res.status(400).json({ message: 'Schema inválido', errors });
    }
    try {
        let formSchema = await FormSchema.findOne({ where: { event_id: eventId } });
        if (formSchema) {
            await formSchema.update({ schema_json });
            logger.info('createOrUpdateFormSchema', 'Schema atualizado', { eventId });
        } else {
            formSchema = await FormSchema.create({ event_id: eventId, schema_json });
            logger.info('createOrUpdateFormSchema', 'Schema criado', { eventId });
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
        const formSchema = await FormSchema.findOne({ where: { event_id: eventId } });
        if (!formSchema) {
            logger.warn('getFormSchemaByEventId', 'Schema não encontrado', eventId);
            return res.status(404).json({ message: 'Schema não encontrado.' });
        }
        return res.status(200).json(formSchema);
    } catch (error) {
        logger.error('getFormSchemaByEventId', 'Erro ao buscar schema', error);
        return res.status(500).json({ message: 'Erro ao buscar schema', error });
    }
};

export const getFormSchemaExamples = async (req: Request, res: Response) => {
    return res.status(200).json({ examples: exampleSchemas });
};