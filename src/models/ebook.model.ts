import { DataTypes, Model, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
    class Ebook extends Model {
        public id!: number;
        public title!: string;
        public description!: string;
        public type!: 'free' | 'paid';
        public filePath?: string;
        public externalLink?: string;
    }

    Ebook.init(
        {
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            type: {
                type: DataTypes.ENUM('free', 'paid'),
                allowNull: false,
                defaultValue: 'free',
            },
            filePath: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            externalLink: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'Ebook',
            tableName: 'ebooks',
            timestamps: true,
        }
    );

    return Ebook;
};
