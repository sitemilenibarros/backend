import express from 'express';
import path from 'path';

// Função que configura os caminhos estáticos
export const serveStaticFiles = (app: express.Application) => {
    // Configuração para servir imagens da pasta "assets/services"
    app.use('/assets/services', express.static(path.join(__dirname, '../assets/services')));
    app.use('/assets/events', express.static(path.join(__dirname, '../assets/events')));
    app.use('/assets/testimonials', express.static(path.join(__dirname, '../assets/testimonials')));

};
