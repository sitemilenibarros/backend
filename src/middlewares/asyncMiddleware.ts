import { Request, Response, NextFunction } from 'express';

// Middleware para capturar erros assíncronos
const asyncMiddleware = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next); // Captura erros e passa para o próximo middleware
};

export default asyncMiddleware;
