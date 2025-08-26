import { Router } from 'express';
import {
    getAllCustomers,
    syncEventBuyers,
    stripeWebhook,
} from '../controllers/customers.controller';
import asyncMiddleware from '../middlewares/asyncMiddleware';
import authMiddleware from '../middlewares/authMiddleware';

const customerRoutes = Router();

// Endpoint para listar todos os clientes
customerRoutes.get('/customers', asyncMiddleware(getAllCustomers));

// Endpoint para sincronizar manualmente os compradores de um evento
customerRoutes.post('/events/:id/sincronizar-compradores', authMiddleware, asyncMiddleware(syncEventBuyers));

// Endpoint de Webhook da Stripe
customerRoutes.post('/webhooks/stripe', authMiddleware, asyncMiddleware(stripeWebhook));

export default customerRoutes;