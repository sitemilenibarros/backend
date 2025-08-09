import { Request, Response } from 'express';
import Stripe from 'stripe';
import EventFactory from '../models/events.model';
import CustomerFactory from '../models/customers.model';
import EventCustomersFactory from '../models/eventCustomers.model';
import sequelize from '../config/db';

const Event = EventFactory(sequelize);
const Customer = CustomerFactory(sequelize);
const EventCustomers = EventCustomersFactory(sequelize);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2025-07-30.basil',
});

// Endpoint para listar todos os clientes
export const getAllCustomers = async (_req: Request, res: Response): Promise<Response> => {
    try {
        const allCustomers = await Customer.findAll();
        return res.status(200).json({ customers: allCustomers });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao listar clientes.' });
    }
};

// Endpoint para sincronizar manualmente os compradores de um evento
export const syncEventBuyers = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;

    try {
        console.log(`[Sync] Iniciando sincronização para o evento ID: ${id}`);
        const event = await Event.findByPk(id);

        if (!event || !event.stripe_product_id) {
            return res.status(404).json({ message: 'Evento não encontrado ou sem integração com Stripe.' });
        }

        const sessions = await stripe.checkout.sessions.list({ limit: 100 });
        const paidSessions = sessions.data.filter(s => s.payment_status === 'paid');
        const validSessions = [];

        for (const session of paidSessions) {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
            if (lineItems.data[0]?.price?.product === event.stripe_product_id) {
                validSessions.push(session);
            }
        }

        console.log(`[Sync] ${validSessions.length} sessões pagas correspondem ao produto do evento.`);

        for (const session of validSessions) {
            // A lógica aqui é capaz de recuperar todos os dados necessários
            if (session.customer_details?.email && session.metadata?.documento && session.customer) {
                const customerData = {
                    name: session.customer_details.name || '',
                    email: session.customer_details.email,
                    documento: session.metadata.documento,
                    stripe_customer_id: session.customer as string,
                    status: 'paid' as 'paid',
                };

                const [customer, created] = await Customer.findOrCreate({
                    where: { email: customerData.email },
                    defaults: customerData,
                });

                if (!created) {
                    // Se o cliente já existe, atualiza com os dados da Stripe
                    await customer.update(customerData);
                    console.log(`[Sync] Cliente ID ${customer.id} atualizado com dados da Stripe.`);
                } else {
                    console.log(`[Sync] Cliente ID ${customer.id} criado.`);
                }

                await EventCustomers.findOrCreate({
                    where: { event_id: id, customer_id: customer.id },
                });
                console.log(`[Sync] Cliente ID ${customer.id} vinculado ao evento ID ${id}.`);

            } else {
                console.log(`[Sync] Sessão ID ${session.id} não possui todos os detalhes necessários. Pulando.`);
            }
        }

        console.log(`[Sync] Sincronização para o evento ID ${id} concluída com sucesso.`);
        return res.status(200).json({ message: 'Compradores sincronizados com sucesso.' });
    } catch (err) {
        console.error('[Sync] Erro inesperado durante a sincronização:', err);
        return res.status(500).json({ message: 'Erro ao sincronizar compradores.' });
    }
};

// Endpoint de Webhook da Stripe
export const stripeWebhook = async (req: Request, res: Response): Promise<Response> => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET as string
        );
    } catch (err: any) {
        console.error(`Erro de verificação do Webhook: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case 'checkout.session.completed':
            await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
            break;
        default:
            console.log(`Evento de webhook não tratado: ${event.type}`);
    }

    return res.status(200).json({ received: true });
};

const handleCheckoutSessionCompleted = async (session: Stripe.Checkout.Session) => {
    try {
        if (session.payment_status === 'paid' && session.customer && session.metadata?.local_customer_id && session.metadata.event_id) {
            // Asserção de tipo aqui para garantir que stripeCustomer é do tipo correto
            const stripeCustomer = (await stripe.customers.retrieve(session.customer as string)) as Stripe.Customer;

            if (stripeCustomer && stripeCustomer.email) {
                const customer = await Customer.findByPk(session.metadata.local_customer_id);

                if (customer) {
                    await customer.update({
                        stripe_customer_id: stripeCustomer.id,
                        status: 'paid',
                    });

                    await EventCustomers.findOrCreate({
                        where: { event_id: session.metadata.event_id, customer_id: customer.id },
                    });
                }
            }
        }
    } catch (err) {
        console.error('Erro ao processar o evento checkout.session.completed:', err);
    }
};