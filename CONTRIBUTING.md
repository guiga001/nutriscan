# Contributing to NutriTracker

## Code Style

- **Language**: TypeScript (strict mode)
- **Formatting**: Prettier (auto-format on commit)
- **Linting**: ESLint

## Clean Architecture

```
domain/          → Business logic (no dependencies on external libs)
application/     → Use cases (orchestration)
infrastructure/  → Database, APIs, external services
api/             → HTTP Controllers, DTOs
```

## Branch Naming

- `feature/xyz` - New features
- `fix/xyz` - Bug fixes
- `refactor/xyz` - Code improvements
- `docs/xyz` - Documentation

## Pull Request Process

1. Create feature branch from `main`
2. Write tests (>80% coverage)
3. Commit with meaningful messages
4. Push and open PR
5. Request 2+ reviewers
6. Merge after approval + CI pass

## Testing

```bash
# Backend
cd backend
npm run test
npm run test:cov

# Frontend
cd frontend
npm test
```

## Database Migrations

1. Make schema changes in `database/migrations.sql`
2. Test migration locally
3. Document changes
4. Run migration in staging first

## Deployment

See main `README.md` for full checklist.
