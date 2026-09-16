# Environment Variables Specification

The platform utilizes decoupled environment configurations for backend and frontends.

## Backend (.env)

| Variable | Type | Description | Default |
|---|---|---|---|
| `PORT` | Number | Port on which Express server listens | `5000` |
| `NODE_ENV` | String | Environment runtime (`development`, `production`, `test`) | `development` |
| `MONGODB_URI` | String | MongoDB connection URI | `mongodb://localhost:27017/edtech_platform` |
| `CORS_ORIGIN` | String | Comma-separated allowed CORS origins | `http://localhost:3000,http://localhost:3001,http://localhost:3002` |
| `JWT_SECRET` | String | Secret key for access token signing | - |
| `JWT_REFRESH_SECRET` | String | Secret key for refresh token signing | - |
| `JWT_EXPIRES_IN` | String | Duration before access token expires | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | String | Duration before refresh token expires | `7d` |
| `OPENAI_API_KEY` | String | API key for OpenAI LLM | - |
| `GEMINI_API_KEY` | String | API key for Google Gemini | - |
| `REDIS_URL` | String | Redis cache & queue connection URI | `redis://localhost:6379` |
| `JUDGE0_API_URL` | String | Judge0 code execution gateway | - |
| `JUDGE0_API_KEY` | String | Judge0 code execution authentication key | - |

## Frontends (Student, Instructor, Admin)

| Variable | Type | Description | Default |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | String | Base URL pointing to the Express `/api/v1` root | `http://localhost:5000/api/v1` |
