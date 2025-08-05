import express from 'express';
import path from 'path';

export const serveStaticFiles = (app: express.Application) => {
    app.use('/assets/services', express.static(path.join(__dirname, '../assets/services')));
    app.use('/assets/events', express.static(path.join(__dirname, '../assets/events')));
    app.use('/assets/testimonials', express.static(path.join(__dirname, '../assets/testimonials')));
    app.use('/assets/uploads', express.static(path.join(__dirname, '../assets/uploads')));

};
