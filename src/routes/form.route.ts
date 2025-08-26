import { Router } from 'express';
import { createForm, listForms, getFormById, getFormsByEventId } from '../controllers/form.controller';
import asyncMiddleware from '../middlewares/asyncMiddleware';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

router.post('/:eventId', authMiddleware, asyncMiddleware(createForm));
router.get('/', asyncMiddleware(listForms));
router.get('/:id', asyncMiddleware(getFormById));
router.get('/by-event/:eventId', asyncMiddleware(getFormsByEventId));

export default router;
