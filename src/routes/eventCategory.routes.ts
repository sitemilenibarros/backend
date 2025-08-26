import { Router } from 'express';
import {
    createEventCategory,
    getAllEventCategories,
    getEventCategoryById,
    updateEventCategory,
    deleteEventCategory,
} from '../controllers/eventCategory.controller';
import asyncMiddleware from "../middlewares/asyncMiddleware";
import authMiddleware from "../middlewares/authMiddleware";

const router = Router();

router.post('/', authMiddleware, asyncMiddleware(createEventCategory));
router.get('/', asyncMiddleware(getAllEventCategories));
router.get('/:id', asyncMiddleware(getEventCategoryById));
router.put('/:id', authMiddleware, asyncMiddleware(updateEventCategory));
router.delete('/:id', authMiddleware, asyncMiddleware(deleteEventCategory));

export default router;