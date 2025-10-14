# Task Service

A production-ready microservice built with Node.js 22, TypeScript, and following MVC pattern.

## Features

- ✅ TypeScript with strict mode
- ✅ MVC Architecture Pattern
- ✅ Express.js framework
- ✅ Input validation with Joi
- ✅ Error handling middleware
- ✅ Security headers with Helmet
- ✅ Rate limiting
- ✅ CORS enabled
- ✅ Compression
- ✅ Winston logger
- ✅ ESLint & Prettier
- ✅ Jest for testing
- ✅ Environment-based configuration

## Prerequisites

### For Docker Development (Recommended)
- Docker >= 20.10.0
- Docker Compose >= 2.0.0

### For Local Development
- Node.js >= 22.0.0
- pnpm >= 8.0.0

## Installation

### Option 1: Docker Development (Recommended)

```bash
# Copy environment variables
cp .env.example .env

# Build and start the development container
docker-compose up --build
```

The service will be available at **http://localhost:3000** with hot reload enabled.

See [DOCKER_DEV.md](DOCKER_DEV.md) for detailed Docker development guide.

### Option 2: Local Development

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Run in development mode with hot reload
pnpm dev
```

## Development

### Docker (Recommended)

```bash
# Start development container (default)
pnpm dev

# Start with rebuild
pnpm dev:build

# Start in background (detached mode)
pnpm dev:detached

# View logs (when running detached)
pnpm dev:logs

# Stop container
pnpm dev:down
```

### Execute Commands Inside Container

```bash
# Run commands inside the running container
docker-compose exec task-service-dev pnpm test
docker-compose exec task-service-dev pnpm lint
docker-compose exec task-service-dev pnpm build

# Or open a shell
docker-compose exec task-service-dev sh
```

### Local Development (Without Docker)

```bash
# Run locally on your machine
pnpm dev:local
```

## Production

### Docker

```bash
# Build production image
docker build -t task-service:latest .

# Run production container
docker run -p 3000:3000 --env-file .env task-service:latest

# Or using docker-compose
docker-compose --profile production up task-service-prod
```

### Local

```bash
# Build the project
pnpm build

# Start production server
pnpm start
```

## Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

## Code Quality

```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format
```

## API Endpoints

### Health Check
- **GET** `/api/v1/health` - Service health check

### Tasks
- **GET** `/api/v1/tasks` - Get all tasks
- **POST** `/api/v1/tasks` - Create a new task
- **GET** `/api/v1/tasks/:id` - Get task by ID
- **PATCH** `/api/v1/tasks/:id` - Update task
- **DELETE** `/api/v1/tasks/:id` - Delete task

## Project Structure

```
task-service/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Custom middlewares
│   ├── models/          # Data models & DTOs
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── validations/     # Request validation schemas
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── dist/                # Compiled JavaScript
├── .env.example         # Environment variables template
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies and scripts
└── README.md           # Project documentation
```

## Environment Variables

See `.env.example` for all available configuration options.

## Best Practices Implemented

1. **Separation of Concerns**: MVC pattern with clear separation
2. **Error Handling**: Centralized error handling with custom ApiError class
3. **Input Validation**: Joi schemas for request validation
4. **Security**: Helmet, CORS, rate limiting
5. **Logging**: Structured logging with Winston
6. **Code Quality**: ESLint, Prettier, TypeScript strict mode
7. **Testing**: Jest setup with coverage thresholds
8. **Environment Configuration**: Centralized config management
9. **Graceful Shutdown**: Proper signal handling
10. **Performance**: Compression middleware

## License

ISC
