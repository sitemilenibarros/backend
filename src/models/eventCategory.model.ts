import { DataTypes, Model, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
    class EventCategory extends Model {
        public id!: number;
        public name!: string;
        public readonly createdAt!: Date;
        public readonly updatedAt!: Date;
    }

    EventCategory.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'EventCategory',
            tableName: 'event_categories',
            timestamps: true,
        }
    );

    return EventCategory;
};