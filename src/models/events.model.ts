import { DataTypes, Model, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
    class Event extends Model {
        public id!: number;
        public title!: string;
        public description!: string;
        public start_date!: Date;
        public end_date!: Date;
        public status!: string;
        public category_id!: number;
        public price_value_online?: number;
        public price_value_onsite?: number;
        public from_price_value_online?: number;
        public from_price_value_onsite?: number;
        public address?: string;
    }

    Event.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            start_date: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            end_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'pending',
            },
            category_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'event_categories',
                    key: 'id',
                },
            },
            address: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            price_value_online: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            price_value_onsite: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            from_price_value_online: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            from_price_value_onsite: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'Event',
            tableName: 'events',
            timestamps: true,
        }
    );

    return Event;
};