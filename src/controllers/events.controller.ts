import { Request, Response } from 'express';
import EventFactory from '../models/events.model';
import sequelize from '../config/db';
import { sendMail } from '../services/email.service';
import FormFactory from '../models/form.model';

const Event = EventFactory(sequelize);
const Form = FormFactory(sequelize);

export const createEvent = async (req: Request, res: Response): Promise<Response> => {
    console.log('[createEvent] Iniciando criação de evento:', req.body);
    try {
        const newEvent = await Event.create(req.body);
        console.log('[createEvent] Evento criado com sucesso:', newEvent.toJSON());
        return res.status(201).json(newEvent.toJSON());
    } catch (err: any) {
        console.error('[createEvent] Erro ao criar evento:', err);
        return res.status(500).json({ message: 'Erro ao criar evento.' });
    }
};

export const getAllEvents = async (req: Request, res: Response): Promise<Response> => {
    console.log('[getAllEvents] Buscando todos os eventos. Query:', req.query);
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
        console.log(`[getAllEvents] Eventos encontrados: ${eventsList.length}, Total: ${total}`);
        return res.status(200).json({
            events: eventsList,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error('[getAllEvents] Erro ao listar eventos:', err);
        return res.status(500).json({ message: 'Erro ao listar eventos.' });
    }
};

export const getEventById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    console.log(`[getEventById] Buscando evento por ID: ${id}`);
    try {
        const eventFound = await Event.findByPk(id);

        if (!eventFound) {
            console.warn(`[getEventById] Evento não encontrado: ${id}`);
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }

        console.log('[getEventById] Evento encontrado:', eventFound.toJSON());
        return res.status(200).json(eventFound.toJSON());
    } catch (err) {
        console.error('[getEventById] Erro ao buscar evento:', err);
        return res.status(500).json({ message: 'Erro ao buscar evento.' });
    }
};

export const updateEvent = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const updates = req.body;
    console.log(`[updateEvent] Atualizando evento ID: ${id} com dados:`, updates);
    try {
        const [updated] = await Event.update(updates, {
            where: { id },
        });

        if (updated === 0) {
            console.warn(`[updateEvent] Evento não encontrado para atualização: ${id}`);
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }

        const updatedEvent = await Event.findByPk(id);
        console.log('[updateEvent] Evento atualizado:', updatedEvent?.toJSON());
        return res.status(200).json(updatedEvent?.toJSON());
    } catch (err) {
        console.error('[updateEvent] Erro ao atualizar evento:', err);
        return res.status(500).json({ message: 'Erro ao atualizar evento.' });
    }
};

export const partialUpdateEvent = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const updates = req.body;
    console.log(`[partialUpdateEvent] Atualização parcial do evento ID: ${id} com dados:`, updates);
    try {
        const event = await Event.findByPk(id);

        if (!event) {
            console.warn(`[partialUpdateEvent] Evento não encontrado para atualização parcial: ${id}`);
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }

        const updatedEvent = await event.update(updates);
        console.log('[partialUpdateEvent] Evento parcialmente atualizado:', updatedEvent.toJSON());
        return res.status(200).json(updatedEvent.toJSON());
    } catch (err) {
        console.error('[partialUpdateEvent] Erro ao atualizar evento parcialmente:', err);
        return res.status(500).json({ message: 'Erro ao atualizar evento parcialmente.' });
    }
};

export const deleteEvent = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    console.log(`[deleteEvent] Deletando evento ID: ${id}`);
    try {
        const deletedRows = await Event.destroy({
            where: { id },
        });

        if (deletedRows === 0) {
            console.warn(`[deleteEvent] Evento não encontrado para deleção: ${id}`);
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }

        console.log(`[deleteEvent] Evento deletado com sucesso. ID: ${id}`);
        return res.status(200).json({ message: 'Evento deletado com sucesso!' });
    } catch (err) {
        console.error('[deleteEvent] Erro ao deletar evento:', err);
        return res.status(500).json({ message: 'Erro ao deletar evento.' });
    }
};

export const sendMailToEvent = async (req: Request, res: Response): Promise<Response> => {
    const { eventId } = req.params;
    const { content_url } = req.body;

    console.log(`[sendMailToEvent] Iniciando envio de e-mails para evento ${eventId}`);
    const event = await Event.findByPk(eventId);
    if (!event) {
        console.warn(`[sendMailToEvent] Evento não encontrado: ${eventId}`);
        return res.status(404).json({ message: 'Evento não encontrado.' });
    }

    const forms = await Form.findAll({ where: { event_id: eventId } });
    console.log(`[sendMailToEvent] Total de forms encontrados: ${forms.length}`);

    const bccList = (process.env.GMAIL_BCC || '').split(',').map(e => e.trim()).filter(e => !!e);
    console.log(`[sendMailToEvent] E-mails de cópia oculta (BCC):`, bccList);

    let sentCount = 0;
    let failedCount = 0;
    let failedEmails: string[] = [];

    for (const form of forms) {
        const data: any = form.form_data || {};
        const email = data.youtubeEmail || data.email || null;
        const modality = data.modality || '';
        if (!email) {
            console.warn(`[sendMailToEvent] Formulário sem e-mail válido. ID: ${form.id}`);
            continue;
        }

        let htmlBody = '';
        if (modality === 'presencial') {
            const address = event.address || '';
            const mapsUrl = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : '';
            console.log(`[sendMailToEvent] [${email}] Evento presencial. Endereço: ${address}`);
            htmlBody = `
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
        } else {
            console.log(`[sendMailToEvent] [${email}] Evento online. Link: ${content_url}`);
            htmlBody = `
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
        }

        try {
            await sendMail({
                to: email,
                bcc: bccList.length ? bccList.join(',') : undefined,
                subject: `Confirmação de presença - ${event.title}`,
                html: htmlBody,
            });
            sentCount++;
        } catch (err) {
            console.error(`[sendMailToEvent] Erro ao enviar e-mail para ${email}:`, err);
            failedCount++;
            failedEmails.push(email);
        }
    }

    if (sentCount === 0) {
        console.warn(`[sendMailToEvent] Nenhum e-mail enviado com sucesso para evento ${eventId}`);
        return res.status(400).json({ message: 'Nenhum e-mail enviado com sucesso.', failedEmails });
    }

    console.log(`[sendMailToEvent] E-mails enviados com sucesso para evento ${eventId}. Total: ${sentCount}, Falhas: ${failedCount}`);
    return res.status(200).json({ message: 'E-mails enviados com sucesso.', sentCount, failedCount, failedEmails });
};
