import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserFactory from '../models/user.model';
import sequelize from '../config/db';
import { logger } from '../utils/logger';
const User = UserFactory(sequelize);

export const registerUser = async (req: Request, res: Response): Promise<Response> => {
    const { username, password } = req.body;
    logger.info('registerUser', 'Tentando registrar usuário:', username);
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
        logger.warn('registerUser', 'Usuário já existe:', username);
        return res.status(400).json({ message: 'Usuário já existe' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const newUser = await User.create({
            username,
            password: hashedPassword,
        });
        const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET as string, {
            expiresIn: '1h',
        });
        logger.info('registerUser', 'Usuário criado com sucesso:', username);
        return res.status(201).json({ message: 'Usuário criado com sucesso!', token });
    } catch (err) {
        logger.error('registerUser', 'Erro ao criar o usuário:', err);
        throw new Error('Erro ao criar o usuário');
    }
};

export const loginUser = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { username, password } = req.body;
        logger.info('loginUser', 'Tentando login para usuário:', username);
        const user = await User.findOne({ where: { username } });
        if (!user) {
            logger.warn('loginUser', 'Usuário não encontrado:', username);
            throw new Error('Usuário não encontrado');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            logger.warn('loginUser', 'Senha inválida para usuário:', username);
            throw new Error('Senha inválida');
        }
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, {
            expiresIn: '1h',
        });
        logger.info('loginUser', 'Login realizado com sucesso para usuário:', username);
        return res.json({ token });
    } catch (err) {
        logger.error('loginUser', 'Erro ao fazer login:', err);
        return res.status(401).json({ message: 'Credenciais inválidas' });
    }
};

export const checkToken = (req: Request, res: Response) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    logger.info('checkToken', 'Verificando token');
    if (!token) {
        logger.warn('checkToken', 'Token não fornecido');
        return res.status(401).json({ message: 'Token não fornecido' });
    }
    jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded: any) => {
        if (err) {
            logger.warn('checkToken', 'Token inválido');
            return res.status(401).json({ message: 'Token inválido' });
        }
        logger.info('checkToken', 'Token válido');
        return res.status(200).json({ valid: true, userId: decoded.userId });
    });
};
