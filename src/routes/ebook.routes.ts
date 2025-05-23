import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { createEbook, getAllEbooks, getEbookById, updateEbook, deleteEbook } from '../controllers/ebook.controller';
import asyncMiddleware from '../middlewares/asyncMiddleware';

const ebookRoutes = Router();

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, 'assets/ebooks'),
    filename: (_req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
        cb(null, uniqueName);
    },
});

const upload = multer({ storage });

// Free: envia PDF em 'file'; Paid: envia 'externalLink' no body
ebookRoutes.post('/', upload.single('file'), asyncMiddleware(createEbook));
ebookRoutes.get('/', asyncMiddleware(getAllEbooks));
ebookRoutes.get('/:id', asyncMiddleware(getEbookById));
ebookRoutes.put('/:id', upload.single('file'), asyncMiddleware(updateEbook));
ebookRoutes.delete('/:id', asyncMiddleware(deleteEbook));

export default ebookRoutes;