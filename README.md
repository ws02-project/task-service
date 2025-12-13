# Task Service

Microservice for task lifecycle management with project association, gRPC inter-service communication, and event publishing.

## Tech Stack

| Category   | Technology           |
| ---------- | -------------------- |
| Runtime    | Node.js 24 LTS       |
| Language   | TypeScript           |
| Framework  | Express.js           |
| Database   | PostgreSQL + TypeORM |
| API        | REST + gRPC          |
| Messaging  | RabbitMQ             |
| Validation | Joi                  |
| Testing    | Jest + Supertest     |

## Ports

| Service  | Port  |
| -------- | ----- |
| HTTP API | 3000  |
| gRPC     | 50052 |

## Quick Start

### Docker (Recommended)

```bash
docker-compose up -d
```

### Local Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev:local
```

## API Endpoints

### REST API

| Method | Endpoint                   | Description     |
| ------ | -------------------------- | --------------- |
| GET    | `/api/v1/health`           | Health check    |
| GET    | `/api/v1/tasks`            | List tasks      |
| POST   | `/api/v1/tasks`            | Create task     |
| GET    | `/api/v1/tasks/:id`        | Get task        |
| PATCH  | `/api/v1/tasks/:id`        | Update task     |
| DELETE | `/api/v1/tasks/:id`        | Delete task     |
| GET    | `/api/v1/tasks/statistics` | Task statistics |

### gRPC Methods

| Method               | Description             |
| -------------------- | ----------------------- |
| GetTasksByProject    | Get tasks for a project |
| GetTaskStatistics    | Get project task stats  |
| DeleteTasksByProject | Cascade delete tasks    |
| CountTasksByProject  | Count tasks in project  |
| GetTaskById          | Get single task         |

## Events Published

| Event          | Routing Key           |
| -------------- | --------------------- |
| Task Created   | `task.created`        |
| Task Updated   | `task.updated`        |
| Task Deleted   | `task.deleted`        |
| Status Changed | `task.status.changed` |
| Task Assigned  | `task.assigned`       |

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000
GRPC_PORT=50052
SERVICE_NAME=task-service

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskdb
DB_USER=taskuser
DB_PASSWORD=taskpass

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# gRPC Clients
PROJECT_SERVICE_GRPC_URL=localhost:50051
```

## Project Structure

```
src/
├── config/           # Configuration
├── controllers/      # HTTP handlers
├── services/         # Business logic
├── models/           # Database entities
├── routes/           # API routes
├── validations/      # Joi schemas
├── grpc/             # gRPC server & clients
├── messaging/        # RabbitMQ EventBus
├── middlewares/      # Express middleware
├── utils/            # Utilities (logger, ApiError, catchAsync)
└── __tests__/        # Tests (unit + integration)
```

## Scripts

| Command              | Description                   |
| -------------------- | ----------------------------- |
| `pnpm dev`           | Start with Docker             |
| `pnpm dev:local`     | Start locally with hot reload |
| `pnpm build`         | Build TypeScript              |
| `pnpm start`         | Start production              |
| `pnpm test`          | Run tests                     |
| `pnpm lint`          | Lint code                     |
| `pnpm migration:run` | Run migrations                |

## Testing

```bash
# Run all tests
pnpm test

# With coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

## License

MIT
