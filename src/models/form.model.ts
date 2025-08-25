import { DataTypes, Model, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
    class Form extends Model {
        public id!: number;
        public event_id!: number;
        public form_data!: object;
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
        },
        {
            sequelize,
            modelName: 'Form',
            tableName: 'forms',
            timestamps: true,
        }
    );

    return Form;
};
