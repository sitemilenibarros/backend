import { DataTypes, Model, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
    class EventPage extends Model {
        public event_id!: string;
        public event_source!: string;
        public content!: any;
    }

    EventPage.init(
        {
            event_id: {
                type: DataTypes.STRING,
                allowNull: false,
                primaryKey: true,
                // references: {
                //     model: 'events_table',
                //     key: 'id',
                // },
            },
            event_source: {
                type: DataTypes.STRING,
                allowNull: false,
                primaryKey: true,
            },
            content: {
                type: DataTypes.JSONB,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'EventPage',
            tableName: 'event_pages',
            timestamps: true,
        }
    );

    return EventPage;
};