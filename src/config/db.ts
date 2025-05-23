import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

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


sequelize.sync({ force: true })
  .then(() => {
    console.log('Banco de dados sincronizado com sucesso!');
    // Logar os modelos e tabelas criadas
    console.log('Modelos sincronizados:', Object.keys(sequelize.models));
    Object.keys(sequelize.models).forEach(modelName => {
      const model = sequelize.models[modelName];
      console.log(`Tabela do modelo ${modelName}:`, model.tableName);
    });
  })
  .catch(err => {
    console.error('Erro ao sincronizar o banco de dados:', err);
  });

export default sequelize;
