import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import sequelize from './config/db';
import authRoutes from './routes/auth.routes';
import eventsRoutes from './routes/events.route';
import serviceRouter from './routes/service.routes';
import { serveStaticFiles } from './middlewares/staticFilesMiddleware';
import testimonialsRoutes from './routes/testimonials.route';
import ebookRoutes from './routes/ebook.routes';


dotenv.config();

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
serveStaticFiles(app);

app.use('/api/auth', authRoutes);
app.use('/api', eventsRoutes);
app.use('/api', serviceRouter);
app.use('/api', testimonialsRoutes);
app.use('/api/ebooks', ebookRoutes)


sequelize.authenticate()
  .then(() => console.log('Conexão com o banco de dados estabelecida com sucesso.'))
  .catch(err => console.error('Não foi possível conectar ao banco de dados:', err));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
