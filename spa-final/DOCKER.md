# Peacase Docker Configuration

Complete Docker setup for the Peacase spa management platform.

## Quick Start

### Prerequisites

- Docker 24.0+ and Docker Compose v2
- At least 4GB RAM available for Docker
- Ports 3000, 3001, 5432, 6379 available

### Production Deployment

```bash
# 1. Copy environment template and configure
cp .env.example .env
# Edit .env with your production values

# 2. Build and start all services
docker compose up -d --build

# 3. Run database migrations (first time only)
docker compose --profile migrate up migrate

# 4. Check service health
docker compose ps
docker compose logs -f
```

### Development Setup

```bash
# 1. Start development environment
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# 2. Optional: Initialize database with seed data
docker compose -f docker-compose.yml -f docker-compose.dev.yml --profile setup up seed

# 3. Optional: Launch Prisma Studio for database GUI
docker compose -f docker-compose.yml -f docker-compose.dev.yml --profile tools up studio
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| `web` | 3000 | Next.js frontend |
| `api` | 3001 | Express.js API |
| `db` | 5432 | PostgreSQL database |
| `redis` | 6379 | Redis cache/sessions |
| `studio` | 5555 | Prisma Studio (dev only) |

## Common Commands

```bash
# View logs
docker compose logs -f              # All services
docker compose logs -f api          # API only
docker compose logs -f web          # Web only

# Restart services
docker compose restart api
docker compose restart web

# Stop all services
docker compose down

# Stop and remove volumes (DELETES DATA)
docker compose down -v

# Rebuild specific service
docker compose build api --no-cache
docker compose up -d api

# Execute command in container
docker compose exec api sh
docker compose exec db psql -U peacase

# Database operations
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma db push
docker compose exec api npx prisma studio
```

## Architecture

```
                    [nginx/traefik]
                          |
            +-------------+-------------+
            |                           |
        [web:3000]                 [api:3001]
            |                           |
            |                     +-----+-----+
            |                     |           |
                              [db:5432]  [redis:6379]
```

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | Database password | `secure-password` |
| `JWT_SECRET` | JWT signing key | `32+ char string` |
| `JWT_REFRESH_SECRET` | Refresh token key | `32+ char string` |

### Optional (External Services)

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe API key |
| `SENDGRID_API_KEY` | SendGrid email API |
| `TWILIO_ACCOUNT_SID` | Twilio SMS service |

## Production Considerations

### Security

1. **Change all default passwords** in `.env`
2. **Use strong JWT secrets** (min 32 characters)
3. **Enable HTTPS** via reverse proxy (nginx/traefik)
4. **Restrict database access** to internal network only

### Performance

1. **Allocate sufficient resources:**
   - API: 512MB-1GB RAM
   - Web: 256MB-512MB RAM
   - PostgreSQL: 1GB+ RAM
   - Redis: 256MB RAM

2. **Enable PostgreSQL tuning** in production:
   ```yaml
   db:
     command: >
       postgres
       -c shared_buffers=256MB
       -c effective_cache_size=768MB
       -c maintenance_work_mem=64MB
   ```

### Backups

```bash
# Backup database
docker compose exec db pg_dump -U peacase peacase > backup.sql

# Restore database
docker compose exec -T db psql -U peacase peacase < backup.sql

# Backup with timestamp
docker compose exec db pg_dump -U peacase peacase > "backup_$(date +%Y%m%d_%H%M%S).sql"
```

### Scaling

For high-traffic deployments, consider:

1. **Multiple API instances** behind load balancer
2. **Read replicas** for PostgreSQL
3. **Redis cluster** for session distribution
4. **CDN** for static assets

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose logs api

# Verify network
docker compose exec api ping db

# Check environment
docker compose exec api env | grep DATABASE
```

### Database connection issues

```bash
# Test database connection
docker compose exec db pg_isready -U peacase

# Connect directly
docker compose exec db psql -U peacase -d peacase
```

### Port conflicts

```bash
# Check what's using ports
netstat -tlnp | grep -E '3000|3001|5432|6379'

# Use alternate ports in .env
API_PORT=3002
WEB_PORT=3003
DB_PORT=5433
```

### Clean rebuild

```bash
# Nuclear option - removes everything
docker compose down -v --rmi all
docker system prune -af
docker compose up -d --build
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Build and push images
  run: |
    docker compose build
    docker tag peacase-api:latest registry.example.com/peacase-api:${{ github.sha }}
    docker push registry.example.com/peacase-api:${{ github.sha }}
```

### Health Check Endpoints

- API: `GET http://localhost:3001/health`
- Web: `GET http://localhost:3000/`

Both return HTTP 200 when healthy.
