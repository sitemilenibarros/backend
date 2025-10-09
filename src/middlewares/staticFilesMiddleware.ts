import express from 'express';
import path from 'path';
import cors from "cors";

export const serveStaticFiles = (app: express.Application) => {
    app.use(cors({
        origin: '*'
    }));
    app.use((req, res, next) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        next();
    });
    app.use('/backend/assets/services', express.static(path.join(__dirname, '../assets/services')));
    app.use('/backend/assets/events', express.static(path.join(__dirname, '../assets/events')));
    app.use('/backend/assets/testimonials', express.static(path.join(__dirname, '../assets/testimonials')));
    app.use('/backend/assets/uploads', express.static(path.join(__dirname, '../assets/uploads')));

};
