import { Router } from 'express';
import {
    createOrUpdateFormSchema,
    getFormSchemaByEventId,
    getFormSchemaExamples,
    getFormSchemaByEventIdAndModality
} from '../controllers/formSchema.controller';
import authMiddleware from "../middlewares/authMiddleware";
import asyncMiddleware from "../middlewares/asyncMiddleware";

const router = Router();

router.post('/events/:eventId/:modality', authMiddleware, asyncMiddleware(createOrUpdateFormSchema));
router.get('/events/:eventId', asyncMiddleware(getFormSchemaByEventId));
router.get('/events/:eventId/:modality', asyncMiddleware(getFormSchemaByEventIdAndModality));
router.get('/examples', asyncMiddleware(getFormSchemaExamples));

export default router;
