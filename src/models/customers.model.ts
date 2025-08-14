import { DataTypes, Model, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
    class Customer extends Model {
        public id!: number;
        public stripe_customer_id!: string;
        public email!: string;
        public name!: string;
        public documento?: string;
        public status!: string; // Nova coluna para o status
    }

    Customer.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            stripe_customer_id: {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: false,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            documento: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            status: { // Definição da nova coluna
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'pending', // O status inicial será 'pending'
            },
        },
        {
            sequelize,
            modelName: 'Customer',
            tableName: 'customers',
            timestamps: true,
        }
    );

    return Customer;
};