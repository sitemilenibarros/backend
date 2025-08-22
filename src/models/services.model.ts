import { DataTypes, Model, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
    class Service extends Model {
        public id!: number;
        public titulo_servico!: string;
        public subtitulo_servico!: string;
        public imagem!: string;
        public descricao_servico!: string;
        public titulo_topicos_servico!: string;
        public topicos_servico!: string[];
        public objetivo_servico!: string;
        public citacao_servico!: string;
        public cta_titulo!: string;
        public cta_subtitulo!: string;
        public cta_texto_botao!: string;
        public cta_link_botao!: string;
    }

    Service.init(
        {
            titulo_servico: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            subtitulo_servico: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            imagem: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            descricao_servico: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            titulo_topicos_servico: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            topicos_servico: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                allowNull: false,
            },
            objetivo_servico: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            citacao_servico: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            cta_titulo: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            cta_subtitulo: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            cta_texto_botao: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            cta_link_botao: {
                type: DataTypes.STRING,
                allowNull: false,
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
