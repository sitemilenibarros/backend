// src/models/events.model.ts
import { DataTypes, Model, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
    class Event extends Model {
        public event_source!: string;
        public event!: any;
    }

    Event.init(
        {
            event_source: {
                type: DataTypes.STRING,
                allowNull: false,
                primaryKey: true,
            },
            event: {
                type: DataTypes.JSONB,
                allowNull: false,
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