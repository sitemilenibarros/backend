import { DataTypes, Model, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
    class Form extends Model {
        public id!: number;
        public event_id!: number;
        public form_data!: object;
        public payment_status!: 'pending' | 'approved' | 'rejected' | 'cancelled';
        public payment_id?: string;
        public preference_id?: string;
        public payment_created_at?: Date;
        public payment_updated_at?: Date;
        public deletedAt?: Date;
    }

    Form.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            event_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                // references: {
                //     model: 'events',
                //     key: 'id',
                // },
            },
            form_data: {
                type: DataTypes.JSONB,
                allowNull: false,
            },
            payment_status: {
                type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
                allowNull: false,
                defaultValue: 'pending',
            },
            payment_id: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            preference_id: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            payment_created_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            payment_updated_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'Form',
            tableName: 'forms',
            timestamps: true,
            paranoid: true,
        }
    );

    return Form;
};
