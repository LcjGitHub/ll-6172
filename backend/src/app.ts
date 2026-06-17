import express from 'express';
import cors from 'cors';
import housenoStylesRouter from './routes/housenoStyles';
import favoritesRouter from './routes/favorites';
import materialsRouter from './routes/materials';
import statisticsRouter from './routes/statistics';
import visitRecordsRouter from './routes/visitRecords';
import tagsRouter from './routes/tags';
import './seed';

/**
 * 创建 Express 应用实例。
 */
export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/houseno-styles', housenoStylesRouter);
  app.use('/api/favorites', favoritesRouter);
  app.use('/api/materials', materialsRouter);
  app.use('/api/statistics', statisticsRouter);
  app.use('/api/visit-records', visitRecordsRouter);
  app.use('/api/tags', tagsRouter);

  return app;
}

export default createApp;
