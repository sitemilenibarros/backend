import { DataTypes, Model, Sequelize } from 'sequelize';

// Modelo de Usuário (para autenticação)
export default (sequelize: Sequelize) => {
    class User extends Model {
        public id!: number;
        public username!: string;
        public password!: string;
    }

    User.init(
        {
            username: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'User',
            tableName: 'users',
            timestamps: true,
        }
    );

    return User;
};
