import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import sequelize from './config/db';
import authRoutes from './routes/auth.routes';
import eventsPagesRoutes from './routes/eventsPage.route';
import eventsRouter from './routes/events.route';
import serviceRouter from './routes/service.routes';
import { serveStaticFiles } from './middlewares/staticFilesMiddleware';
import testimonialsRoutes from './routes/testimonials.route';
import ebookRoutes from './routes/ebook.routes';
import assetsRoutes from './routes/assets.routes';
import eventCategoryRoutes from "./routes/eventCategory.routes";
import formRoutes from './routes/form.route';
import { logger } from './utils/logger';
import userRoutes from "./routes/user.routes";


dotenv.config();

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
serveStaticFiles(app);

app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', eventsPagesRoutes);
app.use('/api', eventsRouter)
app.use('/api', serviceRouter);
app.use('/api', testimonialsRoutes);
app.use('/api/ebooks', ebookRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/event-categories', eventCategoryRoutes);
app.use('/api/forms', formRoutes);


sequelize.authenticate()
  .then(() => logger.info('startup', 'Conexão com o banco de dados estabelecida com sucesso.'))
  .catch(err => logger.error('startup', 'Não foi possível conectar ao banco de dados', err));

const PORT = process.env.PORT || '3001';

app.listen(PORT, () => {
  logger.info('startup', `Servidor rodando na porta ${PORT}`);
});
