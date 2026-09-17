const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const env = require('./config/env');
const corsConfig = require('./config/cors');
const requestIdMiddleware = require('./middlewares/requestId.middleware');
const structuredLogger = require('./middlewares/logging.middleware');
const sanitizeInput = require('./middlewares/sanitize.middleware');
const protectMassAssignment = require('./middlewares/massAssignment.middleware');
const {
  generalLimiter,
  authLimiter,
  aiLimiter,
  codingLimiter,
  adminLimiter,
} = require('./middlewares/rateLimit.middleware');
const { getHealth, getReadiness, getLiveness } = require('./controllers/health.controller');
const v1Routes = require('./routes/index');
const notFound = require('./middlewares/notFound.middleware');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// Set trust proxy for rate limiters and secure cookies behind proxies (e.g. Nginx, Cloudflare)
app.set('trust proxy', 1);

// 1. Request ID Middleware
app.use(requestIdMiddleware);

// 2. Security Headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: env.isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
            connectSrc: ["'self'", ...corsConfig.origin ? [] : []],
            fontSrc: ["'self'", 'https:', 'data:'],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: [],
          },
        }
      : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: env.isProduction
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// 3. CORS configuration
app.use(cors(corsConfig));

// 4. Cookie parser for HTTP-only refresh tokens
app.use(cookieParser());

// 5. Logging middleware
if (!env.isTest) {
  app.use(morgan('dev'));
  app.use(structuredLogger);
}

// 6. Body parsing with strict limits to prevent memory exhaustion (Section 18)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// 7. NoSQL Injection & Input Sanitization
app.use(sanitizeInput);

// 8. Mass Assignment Protection
app.use(protectMassAssignment);

// 9. Root Health & Readiness Probes (for load balancers & orchestrators)
app.get('/health', getHealth);
app.get('/ready', getReadiness);
app.get('/live', getLiveness);

// 10. General API Rate Limiting
app.use('/api', generalLimiter);

// 11. Tiered Route Rate Limiters
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1/ai', aiLimiter);
app.use('/api/v1/practice', codingLimiter);
app.use('/api/v1/admin', adminLimiter);

// 12. Static uploads directory
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// 13. API v1 Routes
app.use('/api/v1', v1Routes);

// 14. Fallback error and 404 handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
