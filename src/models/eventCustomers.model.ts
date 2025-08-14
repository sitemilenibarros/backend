import { DataTypes, Model, Sequelize } from 'sequelize';
export default (sequelize: Sequelize) => {
    class EventCustomers extends Model {
        public event_id!: number;
        public customer_id!: number;
    }

    EventCustomers.init(
        {
            event_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                references: {
                    model: 'events',
                    key: 'id',
                },
            },
            customer_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                references: {
                    model: 'customers',
                    key: 'id',
                },
            },
        },
        {
            sequelize,
            modelName: 'EventCustomers',
            tableName: 'event_customers',
            timestamps: false,
        }
    );

    return EventCustomers;
};