# Civil Engineering Lab IMS — Backend

Production-grade NestJS backend for a university civil engineering lab's information management system. Manages members, published works, authorship relationships, and anonymous likes.

## Tech Stack

- **NestJS 10** · TypeScript strict mode
- **MongoDB 7** + Mongoose 8
- **JWT** access tokens (15 min) + refresh tokens in httpOnly cookies (7 days)
- **Multer** for file uploads with local storage (swap to S3 via `StorageService` interface)
- **Docker** + **Docker Compose** for containerized deployment

## Quick Start (local)

### Prerequisites

- Node.js ≥ 20
- MongoDB running locally (`mongod`) or via Docker
- `npm` or `pnpm`

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — at minimum set all secrets and MONGO_URI
```

Generate strong secrets:

```bash
openssl rand -base64 64   # for JWT_ACCESS_SECRET and JWT_REFRESH_SECRET
openssl rand -base64 32   # for COOKIE_SECRET
```

### 3. Run in development

```bash
npm run start:dev
```

The app seeds the first admin account on startup using `ADMIN_EMAIL` + `ADMIN_PASSWORD` from `.env`. This is idempotent — it only creates the account if no users exist.

### 4. Get your first access token

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lab.edu","password":"your-admin-password"}'
```

Use the returned `accessToken` in `Authorization: Bearer <token>` headers.

## Docker Compose

```bash
# Copy and configure environment
cp .env.example .env

# Build and start app + MongoDB
docker compose up --build -d

# View logs
docker compose logs -f app

# Stop
docker compose down
```

The app listens on port 3000 (override with `PORT` env var). MongoDB data persists in a named volume.

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | | `development` | Environment mode |
| `PORT` | | `3000` | HTTP server port |
| `MONGO_URI` | ✅ | — | MongoDB connection string |
| `JWT_ACCESS_SECRET` | ✅ | — | Secret for access tokens (≥32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | — | Secret for refresh tokens (different from access) |
| `JWT_ACCESS_EXPIRY` | | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRY` | | `7d` | Refresh token TTL |
| `COOKIE_SECRET` | ✅ | — | Cookie signing secret |
| `ADMIN_EMAIL` | ✅ | — | Seed admin email |
| `ADMIN_PASSWORD` | ✅ | — | Seed admin password (≥8 chars) |
| `UPLOAD_MAX_BYTES` | | `10485760` | Max file upload size (10 MB) |
| `UPLOAD_DIR` | | `./uploads` | Local upload directory |
| `CORS_ORIGIN` | | `http://localhost:5173` | Allowed CORS origins (comma-separated) |

## Creating the First Admin

The first admin account is seeded automatically on startup from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. To create additional admins:

```bash
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"other@lab.edu","password":"password","accessLevel":"admin"}'
```

There is **no public signup endpoint** by design.

## API Route Summary

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | — | Login (rate limited 5/15min/IP) |
| POST | `/auth/refresh` | cookie | Refresh access token |
| POST | `/auth/logout` | — | Clear refresh cookie |
| GET | `/auth/me` | JWT | Current user with member |

### Users
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/users` | admin | Create user account |
| GET | `/users` | admin | List all users |
| GET | `/users/:id` | admin | Get user |
| PATCH | `/users/:id` | admin | Update user |
| DELETE | `/users/:id` | admin | Delete user |

### Members
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/members` | admin | Create member |
| GET | `/members` | — | List (`?role=&status=&search=`) |
| GET | `/members/:id` | — | Member + authored works |
| PATCH | `/members/:id` | admin or self | Update |
| DELETE | `/members/:id` | admin | Soft delete (→ alumni) |

### Categories
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/categories` | — | List all |
| POST | `/categories` | admin | Create |
| PATCH | `/categories/:id` | admin | Update |
| DELETE | `/categories/:id` | admin | Delete (fails if works exist) |

### Works
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/works` | — | List (`?category=&type=&status=&featured=&search=&authorId=`) |
| GET | `/works/:id` | — | Fully populated (authors, category, attachments) |
| POST | `/works` | editor+ | Create |
| PATCH | `/works/:id` | editor+ | Update |
| DELETE | `/works/:id` | admin | Soft delete (→ archived) |

### Authorship
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/works/:workId/authors` | editor+ | Add author |
| PATCH | `/works/:workId/authors/:authorshipId` | editor+ | Update role/order |
| PUT | `/works/:workId/authors/order` | editor+ | Reorder (transactional) |
| DELETE | `/works/:workId/authors/:authorshipId` | editor+ | Remove author |

### Uploads
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/uploads` | editor+ | Upload file (multipart) |
| GET | `/uploads/work/:workId` | editor+ | List work attachments |
| DELETE | `/uploads/:id` | editor+ | Delete attachment |

### Likes (public)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/works/:workId/likes` | — | Like (idempotent, rate limited 60/h/IP) |
| DELETE | `/works/:workId/likes/:anonymousId` | — | Unlike |
| GET | `/works/:workId/likes/count` | — | Like count |

## Running Tests

```bash
# Unit tests
npm test

# With coverage
npm run test:cov
```

Tests cover:
- `AuthService` — login (valid, wrong password, unknown user), refresh (valid, expired, deleted user)
- `WorksService` — findOne populates authors sorted by order, findAll, NotFoundException
- `LikesService` — idempotent like, idempotent unlike, likeCount increment/decrement

## Project Structure

```
apps/main/src/
├── main.ts                 — Bootstrap (helmet, CORS, validation, cookie-parser)
├── app.module.ts           — Root module
├── config/                 — Joi-validated env config
├── common/                 — Decorators, guards, filters, pipes
├── auth/                   — JWT strategy, login/refresh/logout
├── users/                  — Admin user management
├── members/                — Lab member profiles
├── categories/             — Research domain taxonomy
├── works/                  — Lab achievements with population
├── authorship/             — Author-Work join table
├── uploads/                — File uploads + StorageService abstraction
├── likes/                  — Anonymous like/unlike
└── seeds/                  — First-run admin seeding
```

## Security Notes

- `passwordHash` is never returned in API responses (Mongoose `select: false` + `toJSON` transform)
- Refresh tokens are stateless JWTs — logout clears the cookie server-side but does not revoke the token cryptographically (acceptable for v1; upgrade to Redis-backed revocation for production)
- Login is rate-limited to 5 attempts per 15 minutes per IP
- Likes are rate-limited to 60 per hour per IP
- All secrets must be set via environment variables; none are hardcoded
- `bcrypt` cost factor: 12
