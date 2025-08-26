import { Router } from 'express';
import { createEbook, getAllEbooks, getEbookById, updateEbook, deleteEbook } from '../controllers/ebook.controller';
import asyncMiddleware from '../middlewares/asyncMiddleware';
import authMiddleware from '../middlewares/authMiddleware';

const ebookRoutes = Router();

ebookRoutes.post('/', authMiddleware, asyncMiddleware(createEbook));
ebookRoutes.get('/', asyncMiddleware(getAllEbooks));
ebookRoutes.get('/:id', asyncMiddleware(getEbookById));
ebookRoutes.put('/:id', authMiddleware, asyncMiddleware(updateEbook));
ebookRoutes.delete('/:id', authMiddleware, asyncMiddleware(deleteEbook));

export default ebookRoutes;