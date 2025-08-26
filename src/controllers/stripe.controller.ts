import { Request, Response } from 'express';
import Stripe from 'stripe';
import EventFactory from '../models/events.model';
import CustomerFactory from '../models/customers.model';
import sequelize from '../config/db';

const Event = EventFactory(sequelize);
const Customer = CustomerFactory(sequelize);

const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidCpf = (cpf: string) => {
    if (!cpf) return false;
    cpf = cpf.replace(/[^\d]/g, ''); // Remove caracteres não numéricos
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0, rest;
    for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i-1, i)) * (11 - i);
    rest = (sum * 10) % 11;
    if ((rest === 10) || (rest === 11)) rest = 0;
    if (rest !== parseInt(cpf.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i-1, i)) * (12 - i);
    rest = (sum * 10) % 11;
    if ((rest === 10) || (rest === 11)) rest = 0;
    if (rest !== parseInt(cpf.substring(10, 11))) return false;

    return true;
};

const isValidName = (name: string) => {
    // Verifica se tem pelo menos um espaço (nome e sobrenome) e se o tamanho é aceitável
    return name.trim().split(' ').length > 1 && name.length <= 255;
};

// Initialize Stripe with your secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2025-07-30.basil',
});

// Endpoint to create a Stripe product for an existing event
export const createStripeProduct = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    console.log(`[createStripeProduct] Criando produto Stripe para evento ID: ${id}`);
    try {
        const event = await Event.findByPk(id);
        if (!event) {
            console.warn(`[createStripeProduct] Evento não encontrado: ${id}`);
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }
        if (event.stripe_product_id) {
            console.warn(`[createStripeProduct] Produto Stripe já existe para evento ID: ${id}`);
            return res.status(400).json({ message: 'Um produto Stripe já existe para este evento.' });
        }
        const product = await stripe.products.create({
            name: event.title,
            description: event.description || undefined,
        });
        await event.update({ stripe_product_id: product.id });
        console.log(`[createStripeProduct] Produto Stripe criado com ID: ${product.id}`);
        return res.status(201).json({
            message: 'Produto Stripe criado com sucesso.',
            stripe_product_id: product.id,
        });
    } catch (error: any) {
        console.error('[createStripeProduct] Erro ao criar produto Stripe:', error);
        return res.status(500).json({ message: 'Erro ao criar o produto Stripe.' });
    }
};

export const createStripePrice = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { amount, currency } = req.body;
    console.log(`[createStripePrice] Criando preço Stripe para evento ID: ${id}, valor: ${amount}, moeda: ${currency}`);
    try {
        const event = await Event.findByPk(id);
        if (!event || !event.stripe_product_id) {
            console.warn(`[createStripePrice] Evento não encontrado ou sem produto Stripe: ${id}`);
            return res.status(404).json({ message: 'Evento não encontrado ou sem um produto Stripe associado.' });
        }
        const existingPrices = await stripe.prices.list({
            product: event.stripe_product_id,
            active: true,
        });
        for (const price of existingPrices.data) {
            await stripe.prices.update(price.id, {
                active: false,
            });
        }
        const price = await stripe.prices.create({
            unit_amount: amount,
            currency,
            product: event.stripe_product_id,
            nickname: event.title,
        });
        await event.update({ price_value: amount });
        console.log(`[createStripePrice] Preço Stripe criado com ID: ${price.id}`);
        return res.status(201).json({
            message: 'Preço atualizado com sucesso.',
            stripe_price_id: price.id,
            price_value: amount,
        });
    } catch (error: any) {
        console.error('[createStripePrice] Erro ao editar preço Stripe:', error);
        return res.status(500).json({ message: 'Erro ao editar o preço do evento.' });
    }
};

export const createCheckoutSession = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { email, name, documento, successUrl, cancelUrl } = req.body;
    let pendingCustomer: any;
    console.log(`[createCheckoutSession] Criando sessão de checkout para evento ID: ${id}, email: ${email}`);
    if (!isValidEmail(email)) {
        console.warn('[createCheckoutSession] E-mail inválido:', email);
        return res.status(400).json({ message: 'O e-mail fornecido não é válido.' });
    }
    if (!isValidName(name)) {
        console.warn('[createCheckoutSession] Nome inválido:', name);
        return res.status(400).json({ message: 'O nome deve conter nome e sobrenome, com no máximo 255 caracteres.' });
    }
    if (!isValidCpf(documento)) {
        console.warn('[createCheckoutSession] CPF inválido:', documento);
        return res.status(400).json({ message: 'O CPF fornecido não é válido.' });
    }
    try {
        const event = await Event.findByPk(id);
        if (!event || !event.stripe_product_id) {
            console.warn(`[createCheckoutSession] Evento não encontrado ou sem integração Stripe: ${id}`);
            return res.status(404).json({ message: 'Evento não encontrado ou sem integração com Stripe.' });
        }
        const prices = await stripe.prices.list({ product: event.stripe_product_id, active: true, limit: 1 });
        if (prices.data.length === 0) {
            console.warn(`[createCheckoutSession] Nenhum preço Stripe encontrado para evento ID: ${id}`);
            return res.status(404).json({ message: 'Nenhum preço encontrado para este evento na Stripe.' });
        }
        const priceId = prices.data[0].id;
        pendingCustomer = await Customer.create({
            email,
            name,
            documento,
            status: 'pending',
        });
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: [{ price: priceId, quantity: 1 }],
            customer_email: email,
            payment_method_options: {
                card: {
                    installments: {
                        enabled: true
                    }
                }
            },
            metadata: {
                local_customer_id: pendingCustomer.id.toString(),
                event_id: event.id.toString(),
                documento: documento,
            },
            success_url: successUrl,
            cancel_url: cancelUrl,
        });
        console.log(`[createCheckoutSession] Sessão de checkout criada com URL: ${session.url}`);
        return res.status(200).json({ url: session.url });
    } catch (error: any) {
        if (pendingCustomer) {
            await pendingCustomer.destroy();
        }
        console.error('[createCheckoutSession] Erro ao criar sessão de checkout:', error);
        return res.status(500).json({ message: 'Erro ao criar a sessão de checkout.' });
    }
};