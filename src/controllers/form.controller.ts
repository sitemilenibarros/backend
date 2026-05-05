import { Request, Response } from 'express';
import sequelize from '../config/db';
import EventFactory from '../models/events.model';
import FormFactory from '../models/form.model';
import { logger } from '../utils/logger';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { QueryTypes } from 'sequelize';
import ExcelJS from 'exceljs';

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

        if (form_data.imageConsent !== true) {
            return res.status(400).json({ error: 'O consentimento de uso de imagem é obrigatório.' });
        }

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
        const form = await Form.findByPk(id as string);
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
        const modality = req.query.modality as string;
        const includeDeleted = req.query.include_deleted === 'true';

        if (modality && !['presencial', 'online'].includes(modality)) {
            return res.status(400).json({ message: 'Modalidade deve ser "presencial" ou "online".' });
        }

        const replacements: any = {
            eventId,
            limit,
            offset
        };

        let paymentCondition = '';
        if (paymentStatus && ['pending', 'approved', 'rejected', 'cancelled'].includes(paymentStatus)) {
            paymentCondition = 'AND payment_status = :paymentStatus';
            replacements.paymentStatus = paymentStatus;
        } else {
            paymentCondition = 'AND payment_status = :paymentStatus';
            replacements.paymentStatus = 'approved';
        }

        let modalityCondition = '';
        if (modality) {
            modalityCondition = `AND form_data->>'modality' = :modality`;
            replacements.modality = modality;
        }

        let deletedCondition = '';
        if (!includeDeleted) {
            deletedCondition = 'AND "deletedAt" IS NULL';
        }

        console.log('Replacements:', replacements);
        console.log(modalityCondition);


        const query = `
            SELECT * FROM forms
            WHERE event_id = :eventId
            ${paymentCondition}
            ${modalityCondition}
            ${deletedCondition}
            ORDER BY "createdAt" DESC
            LIMIT :limit OFFSET :offset
        `;

        const countQuery = `
            SELECT COUNT(*) as count FROM forms
            WHERE event_id = :eventId
            ${paymentCondition}
            ${modalityCondition}
            ${deletedCondition}
        `;

        const forms = await sequelize.query(query, {
            replacements,
            type: QueryTypes.SELECT
        });

        const [countResult] = await sequelize.query(countQuery, {
            replacements,
            type: QueryTypes.SELECT
        });

        const total = parseInt((countResult as any).count, 10) || 0;

        const enrichedForms = forms.map((form: any) => {
            const formData = form.form_data || {};

            return {
                ...form,
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
            paymentStatus: replacements.paymentStatus,
            modality,
            includeDeleted
        });

        return res.status(200).json({
            forms: enrichedForms,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            filters: {
                payment_status: replacements.paymentStatus,
                modality,
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
        if (form_data.imageConsent !== true) {
            return res.status(400).json({ error: 'O consentimento de uso de imagem é obrigatório.' });
        }

        // Buscar evento
        const event = await Event.findByPk(eventId as string);
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
                         AND payment_status IN ('approved')`,
                { replacements: { eventId }, type: QueryTypes.SELECT }
            );
            const presencialCount = parseInt((result as any).count, 10) || 0;
            logger.info('createFormWithPayment', 'Inscrições presenciais encontradas', { eventId, presencialCount });
            const limit = event.limit_onsite_slots ?? 36;
            if (presencialCount >= limit) {
                return res.status(400).json({ error: `Limite de ${limit} inscrições presenciais atingido para este evento.` });
            }
        }

        if (modality === 'online') {
            const [result] = await sequelize.query(
                `SELECT count(*) AS count
                       FROM forms
                       WHERE event_id = :eventId
                         AND form_data->>'modality' = 'online'
                         AND payment_status IN ('approved')`,
                { replacements: { eventId }, type: QueryTypes.SELECT }
            );
            const onlineCount = parseInt((result as any).count, 10) || 0;
            logger.info('createFormWithPayment', 'Inscrições online encontradas', { eventId, onlineCount });
            const limit = event.limit_online_slots || 999;
            if (onlineCount >= limit) {
                return res.status(400).json({ error: `Limite de ${limit} inscrições online atingido para este evento.` });
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
        const form = await Form.findByPk(formId as string);

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
        const form = await Form.findByPk(formId as string);

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
        const form = await Form.findByPk(formId as string, { paranoid: false });

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

const getEducationLabel = (education: string | undefined) => {
    const labels: Record<string, string> = {
        fundamental: 'Ensino Fundamental',
        medio: 'Ensino Médio',
        graduacao: 'Graduação',
        'pos-graduacao': 'Pós-Graduação',
        'mestrado-doutorado': 'Mestrado/Doutorado'
    };
    return labels[education as string] || education || 'Não informado';
};

const getTreatmentLabel = (treatment: string | undefined) => {
    const labels: Record<string, string> = {
        no: 'Não faz tratamento',
        neurological: 'Tratamento Neurológico',
        psychiatric: 'Tratamento Psiquiátrico'
    };
    return labels[treatment as string] || treatment || 'Não informado';
};

const getCompulsionLabel = (compulsion: string | undefined) => {
    const labels: Record<string, string> = {
        no: 'Não possui compulsão',
        yes: 'Possui compulsão'
    };
    return labels[compulsion as string] || compulsion || 'Não informado';
};

const getPaymentStatusLabel = (status: string | undefined) => {
    const labels: Record<string, string> = {
        pending: 'Pendente',
        approved: 'Aprovado',
        rejected: 'Rejeitado',
        cancelled: 'Cancelado'
    };
    return labels[status as string] || 'Não informado';
};

export const exportEventForms = async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const format = req.query.format as string || 'csv';
    const paymentStatus = req.query.payment_status as string;
    const modality = req.query.modality as string;
    const includeDeleted = req.query.include_deleted === 'true';

    try {
        const replacements: any = { eventId };

        let filters = [];

        if (paymentStatus && ['pending', 'approved', 'rejected', 'cancelled'].includes(paymentStatus)) {
            filters.push('payment_status = :paymentStatus');
            replacements.paymentStatus = paymentStatus;
        } else {
            filters.push('payment_status = :paymentStatus');
            replacements.paymentStatus = 'approved';
        }

        if (modality && ['presencial', 'online'].includes(modality)) {
            filters.push(`form_data->>'modality' = :modality`);
            replacements.modality = modality;
        }

        if (!includeDeleted) {
            filters.push('"deletedAt" IS NULL');
        }

        const whereClause = filters.length > 0 ? `AND ${filters.join(' AND ')}` : '';

        const query = `
            SELECT * FROM forms
            WHERE event_id = :eventId
            ${whereClause}
            ORDER BY form_data->>'name' ASC, "createdAt" DESC
        `;

        const forms = await sequelize.query(query, {
            replacements,
            type: QueryTypes.SELECT
        }) as any[];

        if (forms.length === 0) {
            return res.status(404).json({ message: 'Nenhuma inscrição encontrada para exportação.' });
        }

        const normalizeName = (rawName: string | undefined) => {
            if (!rawName) return '';
            return rawName.trim().toLowerCase().split(/\s+/).map(part => {
                return part.split('-').map(sub => sub.length > 0 ? (sub[0].toUpperCase() + sub.slice(1)) : '').join('-');
            }).join(' ');
        };

        const normalizeEmail = (rawEmail: string | undefined) => {
            if (!rawEmail) return '';
            return rawEmail.trim().toLowerCase();
        };

        const enrichedForms = forms.map((form: any) => {
            const formData = form.form_data || {};
            const rawName = formData.name;
            const rawEmail = formData.email || formData.youtubeEmail;
            return {
                Name: rawName ? normalizeName(rawName) : 'Não informado',
                Email: rawEmail ? normalizeEmail(rawEmail) : 'Não informado',
                Phone: formData.phone || '',
                Modality: formData.modality === 'presencial' ? 'Presencial' : 'Online',
                Age: formData.age || '',
                Education: getEducationLabel(formData.education),
                Treatment: getTreatmentLabel(formData.treatment),
                TreatmentDetails: formData.treatmentDetails || '',
                Compulsion: getCompulsionLabel(formData.compulsion),
                CompulsionDetails: formData.compulsionDetails || '',
                Goals: formData.goals || '',
                PaymentStatus: getPaymentStatusLabel(form.payment_status),
                RegistrationDate: new Date(form.createdAt).toLocaleString('pt-BR')
            };
        });

        if (format === 'csv') {
            const fields = Object.keys(enrichedForms[0]);
            const replacer = (key: string, value: any) => value === null ? '' : value;

            const csvData = enrichedForms.map(row =>
                fields.map(fieldName => JSON.stringify(row[fieldName as keyof typeof row], replacer)).join(',')
            );

            csvData.unshift(fields.join(','));
            const csvString = csvData.join('\r\n');

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename=inscricoes_${eventId}_${Date.now()}.csv`);
            return res.send(Buffer.from('\\uFEFF' + csvString, 'utf-8')); // Add BOM for excel
        }
        else if (format === 'xlsx') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Inscrições');

            worksheet.columns = [
                { header: 'Nome', key: 'Name', width: 30 },
                { header: 'E-mail', key: 'Email', width: 35 },
                { header: 'Telefone', key: 'Phone', width: 20 },
                { header: 'Modalidade', key: 'Modality', width: 15 },
                { header: 'Idade', key: 'Age', width: 10 },
                { header: 'Educação', key: 'Education', width: 25 },
                { header: 'Tratamento', key: 'Treatment', width: 25 },
                { header: 'Detalhes Tratamento', key: 'TreatmentDetails', width: 30 },
                { header: 'Compulsão', key: 'Compulsion', width: 20 },
                { header: 'Detalhes Compulsão', key: 'CompulsionDetails', width: 30 },
                { header: 'Objetivos', key: 'Goals', width: 40 },
                { header: 'Status Pagamento', key: 'PaymentStatus', width: 20 },
                { header: 'Data Inscrição', key: 'RegistrationDate', width: 22 }
            ];

            worksheet.addRows(enrichedForms);

            worksheet.getRow(1).font = { bold: true };

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=inscricoes_${eventId}_${Date.now()}.xlsx`);

            await workbook.xlsx.write(res);
            return res.end();
        }
        else if (format === 'txt') {
            const cols = [
                { key: 'Row', label: 'Nº' },
                { key: 'Name', label: 'Nome' },
                { key: 'Email', label: 'E-mail' },
                { key: 'Phone', label: 'Telefone' },
                { key: 'Modality', label: 'Modalidade' },
                { key: 'Age', label: 'Idade' },
                { key: 'Education', label: 'Educação' },
                { key: 'Treatment', label: 'Tratamento' },
                { key: 'Compulsion', label: 'Compulsão' },
                { key: 'PaymentStatus', label: 'Pagamento' },
                { key: 'RegistrationDate', label: 'Data Inscrição' }
            ];

            const colWidths = cols.map(col => {
                let maxContentLen = 0;
                if (col.key === 'Row') {
                    // Determine width based on total number of rows (digits needed) so buildRow will right-align the row number column and left-align others
                    maxContentLen = String(enrichedForms.length).length;
                } else {
                    maxContentLen = Math.max(
                        ...enrichedForms.map(form => String((form as Record<string, any>)[col.key] || '').length)
                    );
                }
                return Math.max(col.label.length, maxContentLen) + 2;
            });

            const buildRow = (rowData: string[]) => {
                return rowData.map((val, idx) => {
                    const str = val || '';
                    if (cols[idx].key === 'Row') {
                        return str.padStart(colWidths[idx], ' ');
                    }
                    return str.padEnd(colWidths[idx], ' ');
                }).join('| ');
            };

            let txtContent = `RELATÓRIO DE INSCRIÇÕES - EVENTO #${eventId}\n`;
            txtContent += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
            txtContent += `Total de inscrições: ${enrichedForms.length}\n\n`;

            const headerStrs = cols.map(c => c.label);
            txtContent += buildRow(headerStrs) + '\n';
            txtContent += '-'.repeat(colWidths.reduce((a, b) => a + b, 0) + (cols.length * 2)) + '\n';

            enrichedForms.forEach((form, i) => {
                const rowStrs = cols.map(c => {
                    if (c.key === 'Row') return String(i + 1);
                    return String((form as Record<string, any>)[c.key] || '');
                });
                txtContent += buildRow(rowStrs) + '\n';
            });

            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename=relatorio_${eventId}_${Date.now()}.txt`);
            return res.send(txtContent);
        } else {
            return res.status(400).json({ message: 'Formato de exportação não suportado. Use csv, txt ou xlsx.' });
        }

    } catch (error) {
        logger.error('exportEventForms', 'Erro ao exportar formulários', error);
        return res.status(500).json({ message: 'Erro ao exportar formulários', error });
    }
};
