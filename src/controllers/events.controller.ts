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

        if (modality !== 'online' || !email) {
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

export const sendMailToParticipant = async (req: Request, res: Response): Promise<Response> => {
    const { eventId, formId } = req.params;
    const { content_url } = req.body;

    logger.info('sendMailToParticipant', 'Iniciando envio individual', { eventId, formId });
    
    const event = await Event.findByPk(eventId);
    if (!event) {
        logger.warn('sendMailToParticipant', 'Evento não encontrado', eventId);
        return res.status(404).json({ message: 'Evento não encontrado.' });
    }

    const form = await Form.findOne({ where: { id: formId, event_id: eventId } });
    if (!form) {
        logger.warn('sendMailToParticipant', 'Formulário não encontrado', { formId, eventId });
        return res.status(404).json({ message: 'Participante não encontrado.' });
    }

    const data: any = form.form_data || {};
    const email = data.youtubeEmail || data.email;
    const name = data.name || 'Participante';

    if (!email) {
        logger.warn('sendMailToParticipant', 'Email não encontrado no formulário', formId);
        return res.status(400).json({ message: 'Email do participante não encontrado.' });
    }

    const bccList = (process.env.GMAIL_BCC || '').split(',').map(e => e.trim()).filter(e => !!e);

    let htmlBody = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f8fb; padding:0; font-family:Arial,sans-serif;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:16px; box-shadow:0 2px 8px #e3eaf2; margin:32px 0;">
            <tr>
              <td style="padding:32px 40px; text-align:center;">
                <h1 style="color:#2d3748; font-size:24px; font-weight:bold; margin:0 0 24px;">
                  Link da Conferência
                </h1>
                <p style="color:#4a5568; font-size:16px; line-height:1.6; margin:0 0 24px;">
                  Olá ${name}!<br><br>
                  Aqui está o link para acessar a conferência do evento <strong>${event.title}</strong>:
                </p>
                <div style="background:#f7fafc; border-radius:8px; padding:24px; margin:24px 0;">
                  <a href="${content_url}" 
                     style="display:inline-block; background:#3182ce; color:white; text-decoration:none; 
                            padding:16px 32px; border-radius:8px; font-weight:bold; font-size:16px;">
                    Acessar Conferência
                  </a>
                </div>
                <p style="color:#718096; font-size:14px; margin:24px 0 0;">
                  Ou copie e cole o link: <br>
                  <span style="color:#3182ce; word-break:break-all;">${content_url}</span>
                </p>
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
            subject: `Link da Conferência - ${event.title}`,
            html: htmlBody,
        });
        
        logger.info('sendMailToParticipant', 'Email enviado com sucesso', { email, eventId, formId });
        return res.status(200).json({ 
            success: true, 
            message: `Link da conferência enviado para ${name} (${email})`,
            participant: { name, email }
        });
        
    } catch (err) {
        logger.error('sendMailToParticipant', 'Erro ao enviar e-mail', { email, err });
        return res.status(500).json({ 
            success: false, 
            message: 'Erro ao enviar email. Tente novamente.',
            error: err 
        });
    }
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



export const mercadoPagoWebhook = async (req: Request, res: Response): Promise<Response> => {
    try {
        logger.info('mercadoPagoWebhook', 'INICIO WEBHOOK');
        logger.info('mercadoPagoWebhook', 'Headers', req.headers);
        logger.info('mercadoPagoWebhook', 'Query params', req.query);
        logger.info('mercadoPagoWebhook', 'Body', req.body);
        logger.info('mercadoPagoWebhook', 'Method/URL/IP/UA', { method: req.method, url: req.url, ip: req.ip, ua: req.get('User-Agent') });

        const { type, action, data } = req.body;
        const { id, topic } = req.query as any;

        // Log básico das informações recebidas
        if (type) logger.info('mercadoPagoWebhook', 'Tipo notificação', type);
        if (action) logger.info('mercadoPagoWebhook', 'Ação', action);
        if (data && data.id) logger.info('mercadoPagoWebhook', 'ID pagamento/recurso', data.id);
        if (id) logger.debug('mercadoPagoWebhook', 'Query param ID', id);
        if (topic) logger.debug('mercadoPagoWebhook', 'Query param Topic', topic);

        // Processar notificação de pagamento
        if (type === 'payment' || topic === 'payment') {
            const paymentId = data?.id || id;
            
            if (!paymentId) {
                logger.warn('mercadoPagoWebhook', 'Payment ID não encontrado na notificação');
                return res.status(200).json({ received: true, warning: 'Payment ID não encontrado' });
            }

            logger.info('mercadoPagoWebhook', 'Processando notificação de pagamento', { paymentId });

            try {
                // Buscar informações do pagamento na API do MercadoPago
                const { Payment } = await import('mercadopago');
                const payment = new Payment(client);
                const paymentInfo = await payment.get({ id: paymentId });

                logger.info('mercadoPagoWebhook', 'Informações do pagamento obtidas', {
                    paymentId,
                    status: paymentInfo.status,
                    external_reference: paymentInfo.external_reference
                });

                // Extrair form_id do external_reference
                const externalRef = paymentInfo.external_reference || '';
                const formIdMatch = externalRef.match(/^form-(\d+)-/);
                
                if (!formIdMatch) {
                    logger.warn('mercadoPagoWebhook', 'Form ID não encontrado no external_reference', { external_reference: externalRef });
                    return res.status(200).json({ received: true, warning: 'Form ID não encontrado' });
                }

                const formId = parseInt(formIdMatch[1]);
                logger.info('mercadoPagoWebhook', 'Form ID extraído', { formId, external_reference: externalRef });

                // Buscar formulário
                const form = await Form.findByPk(formId);
                if (!form) {
                    logger.warn('mercadoPagoWebhook', 'Formulário não encontrado', { formId });
                    return res.status(200).json({ received: true, warning: 'Formulário não encontrado' });
                }

                // Mapear status do MercadoPago para nosso enum
                let newStatus: 'pending' | 'approved' | 'rejected' | 'cancelled' = 'pending';
                
                switch (paymentInfo.status) {
                    case 'approved':
                        newStatus = 'approved';
                        break;
                    case 'rejected':
                        newStatus = 'rejected';
                        break;
                    case 'cancelled':
                        newStatus = 'cancelled';
                        break;
                    case 'pending':
                    case 'in_process':
                    case 'in_mediation':
                        newStatus = 'pending';
                        break;
                    default:
                        logger.warn('mercadoPagoWebhook', 'Status desconhecido do MercadoPago', { status: paymentInfo.status });
                        newStatus = 'pending';
                }

                // Atualizar formulário apenas se o status mudou
                if (form.payment_status !== newStatus || !form.payment_id) {
                    await form.update({
                        payment_status: newStatus,
                        payment_id: paymentId.toString(),
                        payment_updated_at: new Date()
                    });

                    logger.info('mercadoPagoWebhook', 'Status do formulário atualizado', {
                        formId,
                        oldStatus: form.payment_status,
                        newStatus,
                        paymentId
                    });
                } else {
                    logger.info('mercadoPagoWebhook', 'Status não mudou, não atualizando', {
                        formId,
                        currentStatus: form.payment_status,
                        receivedStatus: newStatus
                    });
                }

                return res.status(200).json({ 
                    received: true, 
                    processed: true,
                    form_id: formId,
                    status: newStatus
                });

            } catch (mpError: any) {
                logger.error('mercadoPagoWebhook', 'Erro ao processar pagamento via API MercadoPago', {
                    paymentId,
                    error: mpError.message || mpError
                });
                
                // Retorna sucesso para não reenviar webhook, mas loga o erro
                return res.status(200).json({ 
                    received: true, 
                    error: 'Erro ao processar pagamento',
                    payment_id: paymentId
                });
            }
        }

        // Para outros tipos de notificação, apenas loga
        logger.info('mercadoPagoWebhook', 'Notificação não processada (não é pagamento)', { type, topic });
        return res.status(200).json({ received: true, type: 'not_processed' });

    } catch (error) {
        logger.error('mercadoPagoWebhook', 'Erro geral no webhook', error);
        return res.status(200).json({ received: true, error: 'Erro interno' });
    }
};
