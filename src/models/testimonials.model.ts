import { DataTypes, Model, Sequelize } from 'sequelize';

// Modelo de Testemunhos
export default (sequelize: Sequelize) => {
    class Testimonial extends Model {
        public id!: number;
        public name!: string;
        public testimonial!: string;
        public photo?: string;
    }

    Testimonial.init(
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            testimonial: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            photo: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'Testimonial',
            tableName: 'testimonials',
            timestamps: true,
        }
    );

    return Testimonial;
};
