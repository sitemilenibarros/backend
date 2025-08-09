import { Router } from 'express';
import {
    getAllCustomers,
    syncEventBuyers,
    stripeWebhook,
} from '../controllers/customers.controller';
import asyncMiddleware from '../middlewares/asyncMiddleware';

const customerRoutes = Router();

// Endpoint para listar todos os clientes
customerRoutes.get('/customers', asyncMiddleware(getAllCustomers));

// Endpoint para sincronizar manualmente os compradores de um evento
customerRoutes.post('/events/:id/sincronizar-compradores', asyncMiddleware(syncEventBuyers));

// Endpoint de Webhook da Stripe
customerRoutes.post('/webhooks/stripe', asyncMiddleware(stripeWebhook));

export default customerRoutes;