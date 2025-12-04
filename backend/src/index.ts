import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import eventsRouter from './routes/events';
import dashboardRouter from './routes/dashboard';
import dtcRouter from './routes/dtc';
import { scheduleWeeklyDtcJob } from './jobs/weeklyDtcJob';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/events', eventsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/dtc', dtcRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Vehicle health backend listening on port ${port}`);
});

scheduleWeeklyDtcJob();
