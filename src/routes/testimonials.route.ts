import { Router } from 'express';
import {
    createTestimonial,
    getAllTestimonials,
    getTestimonialById,
    updateTestimonial,
    deleteTestimonial
} from '../controllers/testimonials.controller';
import asyncMiddleware from '../middlewares/asyncMiddleware';
import authMiddleware from '../middlewares/authMiddleware';

const testimonialsRoutes = Router();

testimonialsRoutes.post('/testimonials', authMiddleware, asyncMiddleware(createTestimonial));
testimonialsRoutes.get('/testimonials', asyncMiddleware(getAllTestimonials));
testimonialsRoutes.get('/testimonials/:id', asyncMiddleware(getTestimonialById));
testimonialsRoutes.put('/testimonials/:id', authMiddleware, asyncMiddleware(updateTestimonial));
testimonialsRoutes.delete('/testimonials/:id', authMiddleware, asyncMiddleware(deleteTestimonial));

export default testimonialsRoutes;
