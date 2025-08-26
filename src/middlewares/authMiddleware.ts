import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'default_secret';

const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ message: 'Token não fornecido.' });
        return;
    }

    try {
        // @ts-ignore
        req.user = jwt.verify(token, secret);
        next();
    } catch (err) {
        res.status(403).json({ message: 'Token inválido.' });
    }
};

export default authMiddleware;
