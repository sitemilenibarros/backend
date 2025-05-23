import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserFactory from '../models/user.model';
import sequelize from '../config/db';
const User = UserFactory(sequelize);

export const registerUser = async (req: Request, res: Response): Promise<Response> => {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
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

        return res.status(201).json({ message: 'Usuário criado com sucesso!', token });
    } catch (err) {
        console.error('Erro ao criar o usuário:', err);
        throw new Error('Erro ao criar o usuário');
    }
};

export const loginUser = async (req: Request, res: Response): Promise<Response> => {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });

    if (!user) {
        return res.status(400).json({ message: 'Usuário não encontrado' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Senha inválida' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, {
        expiresIn: '1h',
    });

    return res.json({ token });
};
