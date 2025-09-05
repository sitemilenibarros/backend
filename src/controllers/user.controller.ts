import { Request, Response } from 'express';
import UserFactory from '../models/user.model';
import sequelize from '../config/db';

const User = UserFactory(sequelize);


export const listUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'email']
        });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const updateUser = async (req: any, res: Response) => {
    const user = req.user;
    if (!user || !user.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
    }
    const userId = user.userId;
    const { username, email } = req.body;

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        if (username) user.username = username;
        if (email) user.email = email;

        await user.save();
        res.status(200).json({ message: 'Usuário atualizado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Falha ao atualizar usuário' });
    }
};
