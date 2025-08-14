import { Router } from 'express';
import {
    createTestimonial,
    getAllTestimonials,
    getTestimonialById,
    updateTestimonial,
    deleteTestimonial
} from '../controllers/testimonials.controller';
import asyncMiddleware from '../middlewares/asyncMiddleware';

const testimonialsRoutes = Router();

testimonialsRoutes.post('/testimonials', asyncMiddleware(createTestimonial));
testimonialsRoutes.get('/testimonials', asyncMiddleware(getAllTestimonials));
testimonialsRoutes.get('/testimonials/:id', asyncMiddleware(getTestimonialById));
testimonialsRoutes.put('/testimonials/:id', asyncMiddleware(updateTestimonial));
testimonialsRoutes.delete('/testimonials/:id', asyncMiddleware(deleteTestimonial));

export default testimonialsRoutes;
