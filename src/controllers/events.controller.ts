import { Request, Response } from 'express';
import EventFactory from '../models/events.model';
import sequelize from '../config/db';
import { sendMail } from '../services/email.service';
import FormFactory from '../models/form.model';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { logger } from '../utils/logger';
import {Op, QueryTypes, Sequelize} from "sequelize";

const Event = EventFactory(sequelize);
const Form = FormFactory(sequelize);

if (!process.env.MP_ACCESS_TOKEN) {
    logger.error('startup', 'A variável de ambiente MP_ACCESS_TOKEN não está definida.');
    process.exit(1);
}

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
});

export const createEvent = async (req: Request, res: Response): Promise<Response> => {
    logger.info('createEvent', 'Iniciando criação de evento', req.body);
    try {
        const newEvent = await Event.create(req.body);
        logger.info('createEvent', 'Evento criado com sucesso', newEvent.toJSON());
        return res.status(201).json(newEvent.toJSON());
    } catch (err: any) {
        logger.error('createEvent', 'Erro ao criar evento', err);
        return res.status(500).json({ message: 'Erro ao criar evento.' });
    }
};

export const getAllEvents = async (req: Request, res: Response): Promise<Response> => {
    logger.info('getAllEvents', 'Buscando todos os eventos', req.query);
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const { rows: events, count: total } = await Event.findAndCountAll({
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        const eventsList = events.map((e: any) => e.toJSON());
        logger.info('getAllEvents', `Eventos encontrados: ${eventsList.length}, Total: ${total}`);
        return res.status(200).json({
            events: eventsList,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        logger.error('getAllEvents', 'Erro ao listar eventos', err);
        return res.status(500).json({ message: 'Erro ao listar eventos.' });
    }
};

export const getEventById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    logger.info('getEventById', 'Buscando evento por ID', id);
    try {
        const eventFound = await Event.findByPk(id);

        if (!eventFound) {
            logger.warn('getEventById', 'Evento não encontrado', id);
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }

        logger.info('getEventById', 'Evento encontrado', eventFound.toJSON());
        return res.status(200).json(eventFound.toJSON());
    } catch (err) {
        logger.error('getEventById', 'Erro ao buscar evento', err);
        return res.status(500).json({ message: 'Erro ao buscar evento.' });
    }
};

export const updateEvent = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const updates = req.body;
    logger.info('updateEvent', 'Atualizando evento', { id, updates });
    try {
        const [updated] = await Event.update(updates, {
            where: { id },
        });

        if (updated === 0) {
            logger.warn('updateEvent', 'Evento não encontrado para atualização', id);
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }

        const updatedEvent = await Event.findByPk(id);
        logger.info('updateEvent', 'Evento atualizado', updatedEvent?.toJSON());
        return res.status(200).json(updatedEvent?.toJSON());
    } catch (err) {
        logger.error('updateEvent', 'Erro ao atualizar evento', err);
        return res.status(500).json({ message: 'Erro ao atualizar evento.' });
    }
};

export const partialUpdateEvent = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const updates = req.body;
    logger.info('partialUpdateEvent', 'Atualização parcial do evento', { id, updates });
    try {
        const event = await Event.findByPk(id);

        if (!event) {
            logger.warn('partialUpdateEvent', 'Evento não encontrado para atualização parcial', id);
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }

        const updatedEvent = await event.update(updates);
        logger.info('partialUpdateEvent', 'Evento parcialmente atualizado', updatedEvent.toJSON());
        return res.status(200).json(updatedEvent.toJSON());
    } catch (err) {
        logger.error('partialUpdateEvent', 'Erro ao atualizar evento parcialmente', err);
        return res.status(500).json({ message: 'Erro ao atualizar evento parcialmente.' });
    }
};

export const deleteEvent = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    logger.info('deleteEvent', 'Deletando evento', id);
    try {
        const deletedRows = await Event.destroy({
            where: { id },
        });

        if (deletedRows === 0) {
            logger.warn('deleteEvent', 'Evento não encontrado para deleção', id);
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }

        logger.info('deleteEvent', 'Evento deletado com sucesso', id);
        return res.status(200).json({ message: 'Evento deletado com sucesso!' });
    } catch (err) {
        logger.error('deleteEvent', 'Erro ao deletar evento', err);
        return res.status(500).json({ message: 'Erro ao deletar evento.' });
    }
};

export const sendMailToEvent = async (req: Request, res: Response): Promise<Response> => {
    const { eventId } = req.params;
    const { content_url } = req.body;

    logger.info('sendMailToEvent', 'Iniciando envio de e-mails', { eventId });
    const event = await Event.findByPk(eventId);
    if (!event) {
        logger.warn('sendMailToEvent', 'Evento não encontrado', eventId);
        return res.status(404).json({ message: 'Evento não encontrado.' });
    }

    const forms = await Form.findAll({ where: { event_id: eventId } });
    logger.info('sendMailToEvent', 'Forms encontrados', forms.length);

    const bccList = (process.env.GMAIL_BCC || '').split(',').map(e => e.trim()).filter(e => !!e);
    logger.debug('sendMailToEvent', 'BCC list', bccList);

    let sentCount = 0;
    let failedCount = 0;
    let failedEmails: string[] = [];

    for (const form of forms) {
        const data: any = form.form_data || {};
        const modality = data.modality || '';
        const email = data.youtubeEmail || null;

        if (modality === 'online' || !email) {
            continue;
        }

        let htmlBody = `
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f8fb; padding:0; font-family:Arial,sans-serif;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:16px; box-shadow:0 2px 8px #e3eaf2; margin:32px 0;">
                <tr>
                  <td style="padding:32px; color:#1a237e;">
                    <h2 style="color:#1565c0; margin-bottom:8px;">Obrigado por se inscrever no evento <span style='color:#1a237e'>${event.title}</span>!</h2>
                    <p style="font-size:17px;">Estamos felizes com a sua presença no nosso evento online.</p>
                    <table style="margin:24px 0;">
                      <tr>
                        <td align="center">
                          <a href="${content_url}" style="display:inline-block; padding:14px 32px; background:#1565c0; color:#fff; border-radius:8px; text-decoration:none; font-weight:bold; font-size:18px; border:0; cursor:pointer;">Acessar Evento</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        `;

        try {
            await sendMail({
                to: email,
                bcc: bccList.length ? bccList.join(',') : undefined,
                subject: `Confirmação de presença - ${event.title}`,
                html: htmlBody,
            });
            sentCount++;
        } catch (err) {
            logger.error('sendMailToEvent', 'Erro ao enviar e-mail', { email, err });
            failedCount++;
            failedEmails.push(email);
        }
    }

    if (sentCount === 0) {
        logger.warn('sendMailToEvent', 'Nenhum e-mail enviado com sucesso', { eventId });
        return res.status(400).json({ message: 'Nenhum e-mail enviado com sucesso.', failedEmails });
    }

    logger.info('sendMailToEvent', 'Envio concluído', { eventId, sentCount, failedCount });
    return res.status(200).json({ message: 'E-mails enviados com sucesso.', sentCount, failedCount, failedEmails });
};

export const sendMailOnsiteToEvent = async (req: Request, res: Response): Promise<Response> => {
    const { eventId } = req.params;

    logger.info('sendMailOnsiteToEvent', 'Iniciando envio de e-mails presenciais', { eventId });
    const event = await Event.findByPk(eventId);
    if (!event) {
        logger.warn('sendMailOnsiteToEvent', 'Evento não encontrado', eventId);
        return res.status(404).json({ message: 'Evento não encontrado.' });
    }

    const forms = await Form.findAll({ where: { event_id: eventId } });
    logger.info('sendMailOnsiteToEvent', 'Forms encontrados', forms.length);

    const bccList = (process.env.GMAIL_BCC || '').split(',').map(e => e.trim()).filter(e => !!e);
    logger.debug('sendMailOnsiteToEvent', 'BCC list', bccList);

    let sentCount = 0;
    let failedCount = 0;
    let failedEmails: string[] = [];

    for (const form of forms) {
        const data: any = form.form_data || {};
        const modality = data.modality || '';
        const email = data.email || null;

        if (modality !== 'presencial' || !email) {
            continue;
        }

        const address = event.address || '';
        const mapsUrl = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : '';
        let htmlBody = `
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f8fb; padding:0; font-family:Arial,sans-serif;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:16px; box-shadow:0 2px 8px #e3eaf2; margin:32px 0;">
                <tr>
                  <td style="padding:32px; color:#1a237e;">
                    <h2 style="color:#1565c0; margin-bottom:8px;">Obrigado por se inscrever no evento <span style='color:#1a237e'>${event.title}</span>!</h2>
                    <p style="font-size:17px;">Estamos felizes com a sua presença no nosso evento presencial.</p>
                    <table style="margin:24px 0;">
                      <tr>
                        <td style="background:#e3eaf2; border-radius:8px; padding:16px; color:#1565c0; font-size:17px;">
                          <strong>Endereço do evento:</strong><br>
                          ${address ? `<a href='${mapsUrl}' style='color:#1565c0; text-decoration:underline;' target='_blank'>${address}</a>` : 'Endereço não informado.'}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        `;

        try {
            await sendMail({
                to: email,
                bcc: bccList.length ? bccList.join(',') : undefined,
                subject: `Confirmação de presença - ${event.title}`,
                html: htmlBody,
            });
            sentCount++;
        } catch (err) {
            logger.error('sendMailOnsiteToEvent', 'Erro ao enviar e-mail', { email, err });
            failedCount++;
            failedEmails.push(email);
        }
    }

    if (sentCount === 0) {
        logger.warn('sendMailOnsiteToEvent', 'Nenhum e-mail enviado com sucesso', { eventId });
        return res.status(400).json({ message: 'Nenhum e-mail enviado com sucesso.', failedEmails });
    }

    logger.info('sendMailOnsiteToEvent', 'Envio concluído', { eventId, sentCount, failedCount });
    return res.status(200).json({ message: 'E-mails enviados com sucesso.', sentCount, failedCount, failedEmails });
};

export const createMercadoPagoPreference = async (req: Request, res: Response): Promise<Response> => {
    try {
        logger.info('createMercadoPagoPreference', 'Body recebido', req.body);
        const { eventId, modality } = req.body;

        if (!eventId) {
            return res.status(400).json({ error: 'ID do evento é obrigatório.' });
        }
        if (!modality || !['presencial', 'online'].includes(modality)) {
            return res.status(400).json({ error: 'Modalidade deve ser "presencial" ou "online".' });
        }

        const event = await Event.findByPk(eventId);
        if (!event) {
            logger.warn('createMercadoPagoPreference', 'Evento não encontrado', eventId);
            return res.status(404).json({ error: 'Evento não encontrado.' });
        }

        if (modality === 'presencial') {
            const [result] = await sequelize.query(
                `SELECT count(*) AS count
                       FROM forms
                       WHERE event_id = :eventId
                         AND form_data->>'modality' = 'presencial'`,
                { replacements: { eventId }, type: QueryTypes.SELECT }
            );
            const presencialCount = parseInt((result as any).count, 10) || 0;
            logger.info('createMercadoPagoPreference', 'Inscrições presenciais encontradas', { eventId, presencialCount });
            const limit = event.limit_onsite_slots ?? 36;
            if (presencialCount >= limit) {
                return res.status(400).json({ error: `Limite de ${limit} inscrições presenciais atingido para este evento.` });
            }
        }

        const priceValue = modality === 'online' ? event.price_value_online : event.price_value_onsite;

        if (!priceValue) {
            const modalityText = modality === 'online' ? 'online' : 'presencial';
            return res.status(400).json({ error: `Evento não possui preço configurado para modalidade ${modalityText}.` });
        }

        const successUrl = modality === 'presencial'
            ? 'https://milenibarros.com.br/event-registration'
            : 'https://milenibarros.com.br/event-registration-online';

        const body: any = {
            items: [{
                title: event.title,
                unit_price: priceValue / 100,
                quantity: 1,
                currency_id: 'BRL',
                description: event.description || '',
                id: `evento-${eventId}`,
            }],
            external_reference: `evento-${eventId}-${modality}`,
            back_urls: {
                success: successUrl,
                failure: 'https://milenibarros.com.br/payment-denied',
                pending: 'https://milenibarros.com.br/payment-pending',
            },
            auto_return: 'approved',
            notification_url: 'https://api.milenibarros.com.br/api/webhook/mercadopago',
            payment_methods: {
                installments: 12,
            },
            metadata: {
                event_id: eventId,
                modality: modality,
                custom_field: `${event.title} - ${modality}`,
            },
        };

        const preference = new Preference(client);
        const result = await preference.create({ body });

        logger.info('createMercadoPagoPreference', 'Preferência criada', { id: result.id, init_point: result.init_point });
        return res.status(200).json({
            success: true,
            id: result.id,
            init_point: result.init_point,
            event: {
                id: event.id,
                title: event.title,
                price: priceValue / 100,
            },
            modality: modality,
        });
    } catch (error: any) {
        logger.error('createMercadoPagoPreference', 'Erro ao criar preferência', error);
        const errorMessage = error.cause?.[0]?.description || error.message || 'Erro desconhecido ao criar preferência.';
        return res.status(500).json({ error: errorMessage });
    }
};

export const mercadoPagoWebhook = async (req: Request, res: Response): Promise<Response> => {
    try {
        logger.info('mercadoPagoWebhook', 'INICIO WEBHOOK');
        logger.info('mercadoPagoWebhook', 'Headers', req.headers);
        logger.info('mercadoPagoWebhook', 'Query params', req.query);
        logger.info('mercadoPagoWebhook', 'Body', req.body);
        logger.info('mercadoPagoWebhook', 'Method/URL/IP/UA', { method: req.method, url: req.url, ip: req.ip, ua: req.get('User-Agent') });

        const { type, action, data } = req.body;

        if (type) logger.info('mercadoPagoWebhook', 'Tipo notificação', type);
        if (action) logger.info('mercadoPagoWebhook', 'Ação', action);
        if (data) logger.debug('mercadoPagoWebhook', 'Dados notificação', data);
        if (data && data.id) logger.info('mercadoPagoWebhook', 'ID pagamento/recurso', data.id);

        const { id, topic } = req.query as any;
        if (id) logger.debug('mercadoPagoWebhook', 'Query param ID', id);
        if (topic) logger.debug('mercadoPagoWebhook', 'Query param Topic', topic);

        logger.debug('mercadoPagoWebhook', 'FIM WEBHOOK');
        return res.status(200).json({ received: true });
    } catch (error) {
        logger.error('mercadoPagoWebhook', 'Erro no webhook', error);
        return res.status(200).json({ received: true, error: 'Erro interno' });
    }
};
