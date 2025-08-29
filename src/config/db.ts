import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

dotenv.config();

const dbUrl = process.env.DB_URL as string;

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false,
});

const modelsPath = path.join(__dirname, '../models');
fs.readdirSync(modelsPath).forEach((file) => {
  if (file.endsWith('.ts')) {
    const model = require(path.join(modelsPath, file)).default;
    if (model) {
      model(sequelize);
    }
  }
});


sequelize.sync()
  .then(() => {
    logger.info('db', 'Banco de dados sincronizado com sucesso!');
    logger.debug('db', 'Modelos sincronizados', Object.keys(sequelize.models));
    Object.keys(sequelize.models).forEach(modelName => {
      const model = sequelize.models[modelName];
      logger.debug('db', 'Tabela do modelo', { modelName, table: model.tableName });
    });
  })
  .catch(err => {
    logger.error('db', 'Erro ao sincronizar o banco de dados', err);
  });

export default sequelize;
