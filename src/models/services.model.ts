import { DataTypes, Model, Sequelize } from 'sequelize';

// Modelo de Serviços
export default (sequelize: Sequelize) => {
    class Service extends Model {
        public id!: number;
        public name!: string;
        public description!: string;
        public image!: string; // Alterando de "icon" para "image"
    }

    Service.init(
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            image: {
                type: DataTypes.STRING,
                allowNull: false, // Agora a imagem é obrigatória
            },
        },
        {
            sequelize,
            modelName: 'Service',
            tableName: 'services',
            timestamps: true,
        }
    );

    return Service;
};
