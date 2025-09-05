import { DataTypes, Model, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
    class FormSchema extends Model {
        public id!: number;
        public event_id!: number;
        public schema_json!: object;
        public modality!: string;
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
            },
            schema_json: {
                type: DataTypes.JSONB,
                allowNull: false,
            },
            modality: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    isIn: [['online', 'presencial']]
                }
            },
        },
        {
            sequelize,
            modelName: 'FormSchema',
            tableName: 'form_schemas',
            timestamps: true,
            indexes: [
                {
                    unique: true,
                    fields: ['event_id', 'modality']
                }
            ]
        }
    );

    return FormSchema;
};
