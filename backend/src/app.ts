import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import config from './config';
import pinoHttp from 'pino-http';
import logger from './logger';
import swaggerSpec from './swagger';
import { requireAuth } from './middleware/auth';
import errorHandler from './middleware/errorHandler';

import cyclesRouter from './routes/cycles';
import gridRouter from './routes/grid';
import bookingsRouter from './routes/bookings';
import contactsRouter from './routes/contacts';
import registrationRouter from './routes/registration';
import analyticsRouter from './routes/analytics';
import historyRouter from './routes/history';
import authRouter from './routes/auth';

const app = express();

// Security headers
app.use(helmet());

// CORS — restrict origins based on environment
const allowedOrigins =
  config.nodeEnv === 'production'
    ? ([process.env['FRONTEND_URL']].filter(Boolean) as string[])
    : [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:3000',
      ];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

// Body parsing + cookies
app.use(express.json());
app.use(cookieParser());
app.use(compression());

// Request logging (skip health checks)
app.use(
  pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url === '/api/health' },
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
          remoteAddress: req.remoteAddress,
        };
      },
    },
    customProps(req) {
      const props: Record<string, unknown> = {};
      const r = req as { user?: { role: string }; body?: Record<string, unknown> };
      if (r.user) props.user = r.user.role;
      if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method ?? '')) {
        const body = r.body ?? {};
        const { password: _pw, token: _tk, ...safeBody } = body;
        if (Object.keys(safeBody).length > 0) {
          const serialized = JSON.stringify(safeBody);
          props.body =
            serialized.length > 1024 ? serialized.slice(0, 1024) + '...[truncated]' : safeBody;
        }
      }
      return props;
    },
  }),
);

// Rate limiters (skip in test environment)
if (config.nodeEnv !== 'test') {
  app.use(
    '/api/',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests. Please try again later.' },
    }),
  );

  app.use(
    '/api/v1/availability/contacts',
    rateLimit({
      windowMs: 60 * 1000,
      max: 30,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'HubSpot rate limit protection. Please wait a moment.' },
    }),
  );
}

// Public routes (no auth required)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API documentation (disabled in production)
if (config.nodeEnv !== 'production') {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (_req: Request, res: Response) => res.json(swaggerSpec));
}

app.use('/api/auth', authRouter);

// Protected routes — versioned under /api/v1
const v1 = express.Router();
v1.use('/cycles', cyclesRouter);
v1.use('/cycles', registrationRouter);
v1.use('/availability', gridRouter);
v1.use('/availability', bookingsRouter);
v1.use('/availability', contactsRouter);
v1.use('/analytics', analyticsRouter);
v1.use('/history', historyRouter);
app.use('/api/v1', requireAuth, v1);

// Global error handler (must be last)
app.use(errorHandler);

export = app;
