import { Router } from 'express';
import {
    createTestimonial,
    getAllTestimonials,
    getTestimonialById,
    updateTestimonial,
    deleteTestimonial
} from '../controllers/testimonials.controller';
import asyncMiddleware from '../middlewares/asyncMiddleware'; // Middleware de erro
import multer from 'multer';
import path from 'path';

// Configuração do multer para upload de foto
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'assets/testimonials'); // Define o destino da foto
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Garante nome único
    }
});

const upload = multer({ storage, limits: { files: 1 } }); // Limita a quantidade de arquivos a 1 (somente foto)

const testimonialsRoutes = Router();

// Rota para criar um novo testemunho (com upload de foto)
testimonialsRoutes.post('/testimonials', upload.single('photo'), asyncMiddleware(createTestimonial));

// Rota para listar todos os testemunhos
testimonialsRoutes.get('/testimonials', asyncMiddleware(getAllTestimonials));

// Rota para obter um testemunho específico pelo ID
testimonialsRoutes.get('/testimonials/:id', asyncMiddleware(getTestimonialById));

// Rota para atualizar um testemunho específico pelo ID (com upload de foto)
testimonialsRoutes.put('/testimonials/:id', upload.single('photo'), asyncMiddleware(updateTestimonial));

// Rota para deletar um testemunho específico pelo ID
testimonialsRoutes.delete('/testimonials/:id', asyncMiddleware(deleteTestimonial));

export default testimonialsRoutes;
