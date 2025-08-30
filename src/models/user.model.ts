import { DataTypes, Model, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
    class User extends Model {
        public id!: number;
        public username!: string;
        public email!: string | null;
        public password!: string;
    }

    User.init(
        {
            username: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true,
                validate: {
                    isEmail: true,
                }
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
