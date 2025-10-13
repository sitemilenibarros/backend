import { Request, Response } from 'express';
import sequelize from '../config/db';
import EventFactory from '../models/events.model';
import FormFactory from '../models/form.model';
import { logger } from '../utils/logger';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { QueryTypes } from 'sequelize';

const Form = FormFactory(sequelize);
const Event = EventFactory(sequelize);

// Configuração do MercadoPago
if (!process.env.MP_ACCESS_TOKEN) {
    logger.error('startup', 'A variável de ambiente MP_ACCESS_TOKEN não está definida.');
    process.exit(1);
}

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
});

export const createForm = async (req: Request, res: Response) => {
    logger.info('createForm', 'Recebido', req.body);
    try {
        const { eventId } = req.params;
        const form_data = req.body;
        const form = await Form.create({
            event_id: eventId,
            form_data
        });
        logger.info('createForm', 'Formulário criado', { id: form.id, eventId });
        return res.status(201).json(form);
    } catch (error) {
        logger.error('createForm', 'Erro ao salvar formulário', error);
        return res.status(500).json({ message: 'Erro ao salvar formulário', error });
    }
};

export const listForms = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const { rows: forms, count: total } = await Form.findAndCountAll({
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });
        logger.info('listForms', 'Listagem', { qtd: forms.length, total, page });
        return res.status(200).json({
            forms,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        logger.error('listForms', 'Erro ao listar formulários', error);
        return res.status(500).json({ message: 'Erro ao listar formulários', error });
    }
};

export const getFormById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const form = await Form.findByPk(id);
        if (!form) {
            logger.warn('getFormById', 'Formulário não encontrado', id);
            return res.status(404).json({ message: 'Formulário não encontrado.' });
        }
        return res.status(200).json(form);
    } catch (error) {
        logger.error('getFormById', 'Erro ao buscar formulário', error);
        return res.status(500).json({ message: 'Erro ao buscar formulário', error });
    }
};

export const getFormsByEventId = async (req: Request, res: Response) => {
    const { eventId } = req.params;
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const paymentStatus = req.query.payment_status as string;
        const includeDeleted = req.query.include_deleted === 'true';
        
        const whereClause: any = { event_id: eventId };
        
        // Por padrão, trazer apenas os aprovados
        if (paymentStatus && ['pending', 'approved', 'rejected', 'cancelled'].includes(paymentStatus)) {
            whereClause.payment_status = paymentStatus;
        } else {
            whereClause.payment_status = 'approved';
        }
        
        if (!includeDeleted) {
            whereClause.deletedAt = null;
        }
        
        const { rows: forms, count: total } = await Form.findAndCountAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            paranoid: !includeDeleted
        });

        const enrichedForms = forms.map((form: any) => {
            const formJson = form.toJSON();
            const formData = formJson.form_data || {};
            
            return {
                ...formJson,
                participant_name: formData.name || 'Nome não informado',
                participant_email: formData.email || formData.youtubeEmail || 'Email não informado',
                participant_phone: formData.phone || 'Telefone não informado',
                modality: formData.modality || 'Não informado'
            };
        });

        logger.info('getFormsByEventId', 'Listagem por evento', { 
            eventId, 
            qtd: forms.length, 
            total, 
            page,
            paymentStatus,
            includeDeleted 
        });

        return res.status(200).json({
            forms: enrichedForms,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            filters: {
                payment_status: paymentStatus,
                include_deleted: includeDeleted
            }
        });
    } catch (error) {
        logger.error('getFormsByEventId', 'Erro ao buscar formulários por evento', error);
        return res.status(500).json({ message: 'Erro ao buscar formulários por evento', error });
    }
};

// Nova função: Criar formulário + preferência MercadoPago
export const createFormWithPayment = async (req: Request, res: Response) => {
    logger.info('createFormWithPayment', 'Iniciando criação de formulário com pagamento', req.body);
    try {
        const { eventId } = req.params;
        const { modality, ...form_data } = req.body;

        // Validações
        if (!eventId) {
            return res.status(400).json({ error: 'ID do evento é obrigatório.' });
        }
        if (!modality || !['presencial', 'online'].includes(modality)) {
            return res.status(400).json({ error: 'Modalidade deve ser "presencial" ou "online".' });
        }

        // Buscar evento
        const event = await Event.findByPk(eventId);
        if (!event) {
            logger.warn('createFormWithPayment', 'Evento não encontrado', eventId);
            return res.status(404).json({ error: 'Evento não encontrado.' });
        }

        // Verificar limite de vagas presenciais
        if (modality === 'presencial') {
            const [result] = await sequelize.query(
                `SELECT count(*) AS count
                       FROM forms
                       WHERE event_id = :eventId
                         AND form_data->>'modality' = 'presencial'
                         AND payment_status IN ('pending', 'approved')`,
                { replacements: { eventId }, type: QueryTypes.SELECT }
            );
            const presencialCount = parseInt((result as any).count, 10) || 0;
            logger.info('createFormWithPayment', 'Inscrições presenciais encontradas', { eventId, presencialCount });
            const limit = event.limit_onsite_slots ?? 36;
            if (presencialCount >= limit) {
                return res.status(400).json({ error: `Limite de ${limit} inscrições presenciais atingido para este evento.` });
            }
        }

        // Verificar preço
        const priceValue = modality === 'online' ? event.price_value_online : event.price_value_onsite;
        if (!priceValue) {
            const modalityText = modality === 'online' ? 'online' : 'presencial';
            return res.status(400).json({ error: `Evento não possui preço configurado para modalidade ${modalityText}.` });
        }

        // Criar formulário primeiro
        const form = await Form.create({
            event_id: eventId,
            form_data: { ...form_data, modality },
            payment_status: 'pending',
            payment_created_at: new Date()
        });

        logger.info('createFormWithPayment', 'Formulário criado', { formId: form.id, eventId });
        
        const body: any = {
            items: [{
                title: event.title,
                unit_price: priceValue / 100,
                quantity: 1,
                currency_id: 'BRL',
                description: event.description || '',
                id: `form-${form.id}`,
            }],
            external_reference: `form-${form.id}-${modality}`,
            back_urls: {
                success: 'https://milenibarros.com.br/thank-you',
                failure: 'https://milenibarros.com.br/payment-denied',
                pending: 'https://milenibarros.com.br/payment-pending',
            },
            auto_return: 'approved',
            notification_url: 'https://api.milenibarros.com.br/api/webhook/mercadopago',
            payment_methods: {
                installments: 12,
                excluded_payment_types: [{ id: 'ticket' }],
            },
            metadata: {
                form_id: form.id,
                event_id: eventId,
                modality: modality,
                custom_field: `${event.title} - ${modality}`,
            },
        };

        const preference = new Preference(client);
        const result = await preference.create({ body });

        await form.update({
            preference_id: result.id,
            payment_updated_at: new Date()
        });

        logger.info('createFormWithPayment', 'Preferência criada e formulário atualizado', { 
            formId: form.id, 
            preferenceId: result.id, 
            init_point: result.init_point 
        });

        return res.status(201).json({
            success: true,
            form: {
                id: form.id,
                payment_status: form.payment_status
            },
            payment: {
                preference_id: result.id,
                init_point: result.init_point,
                price: priceValue / 100
            },
            event: {
                id: event.id,
                title: event.title
            },
            modality: modality
        });

    } catch (error: any) {
        logger.error('createFormWithPayment', 'Erro ao criar formulário com pagamento', error);
        const errorMessage = error.cause?.[0]?.description || error.message || 'Erro desconhecido ao criar formulário com pagamento.';
        return res.status(500).json({ error: errorMessage });
    }
};

export const getFormByPaymentId = async (req: Request, res: Response) => {
    const { paymentId } = req.params;
    logger.info('getFormByPaymentId', 'Buscando formulário por payment_id', paymentId);
    try {
        const form = await Form.findOne({
            where: { payment_id: paymentId }
        });
        
        if (!form) {
            logger.warn('getFormByPaymentId', 'Formulário não encontrado', paymentId);
            return res.status(404).json({ message: 'Formulário não encontrado para este payment_id.' });
        }
        
        return res.status(200).json(form);
    } catch (error) {
        logger.error('getFormByPaymentId', 'Erro ao buscar formulário por payment_id', error);
        return res.status(500).json({ message: 'Erro ao buscar formulário', error });
    }
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
    const { formId } = req.params;
    const { payment_status, payment_id } = req.body;
    
    logger.info('updatePaymentStatus', 'Atualizando status de pagamento', { formId, payment_status, payment_id });
    
    try {
        const form = await Form.findByPk(formId);
        
        if (!form) {
            logger.warn('updatePaymentStatus', 'Formulário não encontrado', formId);
            return res.status(404).json({ message: 'Formulário não encontrado.' });
        }
        
        await form.update({
            payment_status,
            payment_id,
            payment_updated_at: new Date()
        });
        
        logger.info('updatePaymentStatus', 'Status atualizado com sucesso', { formId, payment_status });
        return res.status(200).json({ 
            success: true, 
            form: {
                id: form.id,
                payment_status: form.payment_status,
                payment_id: form.payment_id
            }
        });
        
    } catch (error) {
        logger.error('updatePaymentStatus', 'Erro ao atualizar status de pagamento', error);
        return res.status(500).json({ message: 'Erro ao atualizar status de pagamento', error });
    }
};

export const softDeleteForm = async (req: Request, res: Response) => {
    const { id: formId } = req.params;
    
    logger.info('softDeleteForm', 'Deletando formulário (soft delete)', formId);
    
    try {
        const form = await Form.findByPk(formId);
        
        if (!form) {
            logger.warn('softDeleteForm', 'Formulário não encontrado', formId);
            return res.status(404).json({ message: 'Formulário não encontrado.' });
        }
        
        await form.destroy();
        
        logger.info('softDeleteForm', 'Formulário deletado com sucesso', formId);
        return res.status(200).json({ 
            success: true, 
            message: 'Formulário deletado com sucesso.',
            form_id: formId
        });
        
    } catch (error) {
        logger.error('softDeleteForm', 'Erro ao deletar formulário', error);
        return res.status(500).json({ message: 'Erro ao deletar formulário', error });
    }
};

export const restoreForm = async (req: Request, res: Response) => {
    const { id: formId } = req.params;
    
    logger.info('restoreForm', 'Restaurando formulário', formId);
    
    try {
        const form = await Form.findByPk(formId, { paranoid: false });
        
        if (!form) {
            logger.warn('restoreForm', 'Formulário não encontrado', formId);
            return res.status(404).json({ message: 'Formulário não encontrado.' });
        }
        
        if (!form.deletedAt) {
            logger.warn('restoreForm', 'Formulário não está deletado', formId);
            return res.status(400).json({ message: 'Formulário não está deletado.' });
        }
        
        await form.restore();
        
        logger.info('restoreForm', 'Formulário restaurado com sucesso', formId);
        return res.status(200).json({ 
            success: true, 
            message: 'Formulário restaurado com sucesso.',
            form_id: formId
        });
        
    } catch (error) {
        logger.error('restoreForm', 'Erro ao restaurar formulário', error);
        return res.status(500).json({ message: 'Erro ao restaurar formulário', error });
    }
};
