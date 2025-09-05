import { DataTypes, Model, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
    class FormSchema extends Model {
        public id!: number;
        public event_id!: number;
        public schema_json!: object;
    }

    FormSchema.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            event_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                unique: true,
            },
            schema_json: {
                type: DataTypes.JSONB,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'FormSchema',
            tableName: 'form_schemas',
            timestamps: true,
        }
    );

    return FormSchema;
};

