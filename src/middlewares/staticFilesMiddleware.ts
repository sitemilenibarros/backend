import express from 'express';
import path from 'path';
import cors from "cors";
import fs from 'fs';
import mime from 'mime';

export const serveStaticFiles = (app: express.Application) => {
    app.use(cors({
        origin: '*'
    }));
    app.use((req, res, next) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        next();
    });

    // Middleware para servir vídeos com suporte a Range Requests
    app.use('/backend/assets/uploads', (req, res, next) => {
        const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v'];
        const filePath = path.join(__dirname, '../assets/uploads', req.path);
        const ext = path.extname(filePath).toLowerCase();
        if (!VIDEO_EXTENSIONS.includes(ext) || !fs.existsSync(filePath)) {
            return next();
        }
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;
        const contentType = mime.getType(ext) || 'application/octet-stream';
        if (!range) {
            res.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': fileSize,
                'Accept-Ranges': 'bytes'
            });
            fs.createReadStream(filePath).pipe(res);
            return;
        }
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        if (start >= fileSize || end >= fileSize) {
            res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
            return;
        }
        const chunkSize = (end - start) + 1;
        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': contentType,
            'Cache-Control': 'no-cache'
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
    });

    app.use('/backend/assets/services', express.static(path.join(__dirname, '../assets/services')));
    app.use('/backend/assets/events', express.static(path.join(__dirname, '../assets/events')));
    app.use('/backend/assets/testimonials', express.static(path.join(__dirname, '../assets/testimonials')));
    app.use('/backend/assets/uploads', express.static(path.join(__dirname, '../assets/uploads')));
};
