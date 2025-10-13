import { Router } from 'express';
import { 
    createForm, 
    listForms, 
    getFormById, 
    getFormsByEventId, 
    createFormWithPayment, 
    getFormByPaymentId, 
    updatePaymentStatus,
    softDeleteForm,
    restoreForm
} from '../controllers/form.controller';
import asyncMiddleware from '../middlewares/asyncMiddleware';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

router.post('/:eventId', asyncMiddleware(createForm));
router.get('/', asyncMiddleware(listForms));
router.get('/:id', asyncMiddleware(getFormById));
router.get('/by-event/:eventId', asyncMiddleware(getFormsByEventId));

router.post('/:eventId/with-payment', asyncMiddleware(createFormWithPayment));
router.get('/payment/:paymentId', asyncMiddleware(getFormByPaymentId));
router.patch('/:formId/payment-status', asyncMiddleware(updatePaymentStatus));

router.delete('/:id/soft', authMiddleware, asyncMiddleware(softDeleteForm));
router.put('/:id/restore', authMiddleware, asyncMiddleware(restoreForm));

export default router;
