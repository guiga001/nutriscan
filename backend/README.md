# NutriTracker Backend API

NestJS + TypeScript backend for nutrition tracking SaaS.

## Getting Started

### Prerequisites
- Node.js 22 LTS
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

### Running with Docker Compose

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on localhost:5432
- Redis on localhost:6379
- Backend API on localhost:3000

### Running Locally

```bash
# Install dependencies
npm install

# Run database migrations
npm run migration:run

# Start development server
npm run dev
```

API will be available at `http://localhost:3000`

## Project Structure

```
src/
├── domain/           # Business logic (dietEngine, menuScanner)
├── application/      # Use cases
├── infrastructure/   # Database, external APIs
├── api/              # Controllers & DTOs
│   ├── macros/       # Macro setup endpoint
│   ├── foods/        # Barcode & food search
│   ├── meals/        # Meal logging
│   └── scanner/      # Menu scanner
├── main.ts           # Entry point
└── app.module.ts     # Root module
```

## API Endpoints

### POST /api/v1/macros/setup
**Calculates daily macros based on biometrics**
```json
Request:
{
  "gender": "male",
  "weight_kg": 80,
  "height_cm": 175,
  "age_years": 28,
  "activity_factor": 1.55,
  "goal": "deficit"
}

Response:
{
  "user_id": "...",
  "tdee": 2758,
  "daily_targets": {
    "kcal": 2743,
    "protein_g": 206,
    "carbs_g": 308,
    "fat_g": 76
  }
}
```

### GET /api/v1/foods/barcode/{code}
**Fetches food info for barcode**
- Checks local cache first
- Falls back to OpenFoodFacts API
- Caches result locally (30 days TTL)

### POST /api/v1/meals/log/{userId}
**Logs a meal and returns suggestions**
```json
Request:
{
  "food_id": "7891000123456",
  "quantity": 1.5,
  "meal_type": "lunch"
}

Response:
{
  "daily_state": {...},
  "meal_suggestions": [...]
}
```

### POST /api/v1/scanner/menu
**Analyzes menu OCR with business rules**
- Highlights "green" (healthy) items
- Marks "red" (unhealthy) items
- Uses Regex rules for classification

## Development

### Running Tests
```bash
npm run test

# With coverage
npm run test:cov
```

### Linting
```bash
npm run lint
```

### Building for Production
```bash
npm run build
npm start  # Run compiled code
```

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL (Prisma)
- **Cache**: Redis
- **External APIs**: OpenFoodFacts, Google Cloud Vision
- **Architecture**: Clean Architecture (Domain/Application/Infrastructure)

## Dependencies

See `package.json` for full list:
- TypeORM - ORM
- Axios - HTTP client
- Class Validator - DTO validation
- Winston - Logging
- Helmet - Security headers
- Compression - Response compression

## Performance Optimizations

- ✅ Database indexes on frequently queried columns
- ✅ Redis caching for food lookups
- ✅ Pagination for large result sets
- ✅ Connection pooling (TypeORM)
- ✅ Compression middleware
- ✅ Rate limiting (@nestjs/throttler)

## Security

- ✅ JWT authentication
- ✅ HTTPS only (in production)
- ✅ Request validation (class-validator)
- ✅ CORS configured
- ✅ Helmet security headers
- ✅ Rate limiting

## Monitoring

- Logs: Winston logger
- Metrics: CloudWatch (in AWS)
- Tracing: X-Ray (in AWS)
