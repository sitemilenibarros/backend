import { Router } from 'express';
import { createEbook, getAllEbooks, getEbookById, updateEbook, deleteEbook } from '../controllers/ebook.controller';
import asyncMiddleware from '../middlewares/asyncMiddleware';

const ebookRoutes = Router();

ebookRoutes.post('/', asyncMiddleware(createEbook));
ebookRoutes.get('/', asyncMiddleware(getAllEbooks));
ebookRoutes.get('/:id', asyncMiddleware(getEbookById));
ebookRoutes.put('/:id', asyncMiddleware(updateEbook));
ebookRoutes.delete('/:id', asyncMiddleware(deleteEbook));

export default ebookRoutes;