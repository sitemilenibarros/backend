import { Router } from 'express';
import {
    createOrUpdateFormSchema,
    getFormSchemaByEventId,
    getFormSchemaExamples
} from '../controllers/formSchema.controller';
import authMiddleware from "../middlewares/authMiddleware";
import asyncMiddleware from "../middlewares/asyncMiddleware";

const router = Router();

router.post('/events/:eventId/form-schema', authMiddleware, asyncMiddleware(createOrUpdateFormSchema));
router.get('/events/:eventId/form-schema', asyncMiddleware(getFormSchemaByEventId));
router.get('/examples', asyncMiddleware(getFormSchemaExamples));

export default router;

