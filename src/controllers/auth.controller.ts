import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserFactory from '../models/user.model';
import sequelize from '../config/db';
import { logger } from '../utils/logger';
import { sendMail } from '../services/email.service';
import passwordResetService from '../services/passwordReset.service';

const User = UserFactory(sequelize);

export const registerUser = async (req: Request, res: Response): Promise<Response> => {
    const { username, password, email } = req.body;
    logger.info('registerUser', 'Tentando registrar usuário:', username);

    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Email inválido' });
        }
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
        logger.warn('registerUser', 'Usuário já existe:', username);
        return res.status(400).json({ message: 'Usuário já existe' });
    }

    if (email) {
        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email já está em uso' });
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const newUser = await User.create({
            username,
            email,
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

export const requestPasswordReset = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email } = req.body;
        logger.info('requestPasswordReset', 'Solicitação de reset para:', email);

        if (!email) {
            return res.status(400).json({ message: 'Email é obrigatório' });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            logger.warn('requestPasswordReset', 'Email não encontrado:', email);
            return res.status(404).json({ message: 'Nenhuma conta encontrada com este email' });
        }

        const resetCode = passwordResetService.generateCode();
        passwordResetService.storeCode(email, resetCode);

        await sendMail({
            to: email,
            subject: 'Código de Recuperação de Senha',
            html: `
                <h2>Recuperação de Senha</h2>
                <p>Seu código de recuperação é: <strong>${resetCode}</strong></p>
                <p>Este código expira em 15 minutos.</p>
                <p>Se você não solicitou esta recuperação, ignore este email.</p>
            `,
            text: `Seu código de recuperação é: ${resetCode}. Este código expira em 15 minutos.`
        });

        logger.info('requestPasswordReset', 'Código enviado para:', email);
        return res.status(200).json({
            message: 'Código de recuperação enviado para seu email',
            accountExists: true
        });

    } catch (err) {
        logger.error('requestPasswordReset', 'Erro:', err);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

export const verifyResetCode = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email, code } = req.body;
        logger.info('verifyResetCode', 'Verificando código para:', email);

        if (!email || !code) {
            return res.status(400).json({ message: 'Email e código são obrigatórios' });
        }

        const isValid = passwordResetService.verifyCode(email, code);

        if (!isValid) {
            logger.warn('verifyResetCode', 'Código inválido ou expirado para:', email);
            return res.status(400).json({ message: 'Código inválido ou expirado' });
        }

        logger.info('verifyResetCode', 'Código válido para:', email);
        return res.status(200).json({ message: 'Código verificado com sucesso', valid: true });

    } catch (err) {
        logger.error('verifyResetCode', 'Erro:', err);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email, code, newPassword } = req.body;
        logger.info('resetPassword', 'Redefinindo senha para:', email);

        if (!email || !code || !newPassword) {
            return res.status(400).json({ message: 'Email, código e nova senha são obrigatórios' });
        }

        const isValid = passwordResetService.verifyCode(email, code);

        if (!isValid) {
            logger.warn('resetPassword', 'Código inválido ou expirado para:', email);
            return res.status(400).json({ message: 'Código inválido ou expirado' });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await user.update({ password: hashedPassword });

        passwordResetService.removeCode(email);

        logger.info('resetPassword', 'Senha redefinida com sucesso para:', email);
        return res.status(200).json({ message: 'Senha redefinida com sucesso' });

    } catch (err) {
        logger.error('resetPassword', 'Erro:', err);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

export const changePassword = async (req: any, res: Response): Promise<Response> => {
    try {
        const _user = req.user;
        if (!_user || !_user.userId) {
            return res.status(401).json({ error: 'Não autorizado' });
        }
        const userId = _user.userId;
        const { currentPassword, newPassword } = req.body;
        if (!userId) {
            return res.status(401).json({ message: 'Não autenticado' });
        }
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Senha atual e nova são obrigatórias' });
        }
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Senha atual incorreta' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ password: hashedPassword });
        logger.info('changePassword', 'Senha alterada com sucesso para:', user.email);
        return res.status(200).json({ message: 'Senha alterada com sucesso' });
    } catch (err) {
        logger.error('changePassword', 'Erro ao alterar senha:', err);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
};
