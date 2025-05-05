import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';


dotenv.config();


const dbUrl = process.env.DB_URL as string;


const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false, 
});

export default sequelize;
