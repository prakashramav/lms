const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend directory or root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// Validation for critical production environment variables
const requiredProductionVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

if (isProduction) {
  const missing = requiredProductionVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    // Fail clearly without exposing any existing secret values
    throw new Error(
      `[Startup Error] Missing required production environment variable(s): ${missing.join(', ')}`
    );
  }
}

// Parse origins safely
const parseOrigins = () => {
  if (process.env.CORS_ORIGIN) {
    return process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
  }
  return [
    process.env.STUDENT_APP_URL || 'http://localhost:3000',
    process.env.INSTRUCTOR_APP_URL || 'http://localhost:3001',
    process.env.ADMIN_APP_URL || 'http://localhost:3002',
  ];
};

const env = {
  APP_VERSION: process.env.APP_VERSION || '1.0.0',
  NODE_ENV,
  isProduction,
  isTest: NODE_ENV === 'test',
  isDevelopment: NODE_ENV === 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  
  // Domains
  STUDENT_APP_URL: process.env.STUDENT_APP_URL || 'http://localhost:3000',
  INSTRUCTOR_APP_URL: process.env.INSTRUCTOR_APP_URL || 'http://localhost:3001',
  ADMIN_APP_URL: process.env.ADMIN_APP_URL || 'http://localhost:3002',
  API_URL: process.env.API_URL || 'http://localhost:5000',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/edtech_platform',
  
  // CORS
  CORS_ORIGIN: parseOrigins(),
  
  // Auth
  JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret_key_change_in_production_min32chars',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_key_change_in_production_min32chars',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
  
  // AI Service
  AI_PROVIDER: process.env.AI_PROVIDER || 'mock',
  AI_MODEL: process.env.AI_MODEL || 'gemini-1.5-flash',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  
  // File Storage
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  
  // Redis & Queue
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Sandbox Execution
  JUDGE0_API_URL: process.env.JUDGE0_API_URL || '',
  JUDGE0_API_KEY: process.env.JUDGE0_API_KEY || '',
};

module.exports = env;
