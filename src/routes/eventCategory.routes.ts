import { Router } from 'express';
import {
    createEventCategory,
    getAllEventCategories,
    getEventCategoryById,
    updateEventCategory,
    deleteEventCategory,
} from '../controllers/eventCategory.controller';
import asyncMiddleware from "../middlewares/asyncMiddleware";

const router = Router();

router.post('/', asyncMiddleware(createEventCategory));
router.get('/', asyncMiddleware(getAllEventCategories));
router.get('/:id', asyncMiddleware(getEventCategoryById));
router.put('/:id', asyncMiddleware(updateEventCategory));
router.delete('/:id', asyncMiddleware(deleteEventCategory));

export default router;