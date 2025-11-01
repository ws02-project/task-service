# Task Service

Microservice for managing tasks in a task management system with optional project association.

## Overview

The Task Service handles task lifecycle management, task statistics, and provides gRPC endpoints for other services to query tasks by project. It communicates with Project Service to validate project access and publishes events for task-related actions.

## Architecture & Technology Stack

### Core Technologies

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL with Knex.js (Query Builder + Migrations)
- **API Style:** REST (HTTP) + gRPC
- **Message Broker:** RabbitMQ (Event Publishing)
- **Validation:** Joi
- **Logging:** Winston
- **Testing:** Jest + Supertest

### Communication Patterns

- **HTTP REST API:** External client communication (port 3000)
- **gRPC Server:** Exposes TaskService on port 50052 for other services
- **gRPC Client:** Calls ProjectService on port 50051 for validation
- **Event Publishing:** Publishes task events to RabbitMQ

### Port Allocation

- **HTTP API:** `3000` (REST endpoints)
- **gRPC Server:** `50052` (TaskService)
- **Database:** PostgreSQL on `5432`
- **RabbitMQ:** `5672` (AMQP)

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ and pnpm (for local development)

### Run with Docker Compose

Start service with database and RabbitMQ:

```bash
cd task-service
docker-compose up -d
```

View logs:

```bash
docker-compose logs -f task-service
```

Stop service:

```bash
docker-compose down
```

### Local Development Setup

Install dependencies:

```bash
pnpm install
```

Start PostgreSQL and RabbitMQ:

```bash
docker-compose up -d task-postgres rabbitmq
```

Run migrations:

```bash
pnpm migration:run
```

Start development server with hot reload:

```bash
pnpm dev
```

Service will be available at:

- HTTP API: http://localhost:3000/api/v1
- gRPC Server: localhost:50052

## API Endpoints

### REST API

Base URL: `http://localhost:3000/api/v1`

#### Health Check

- **GET** `/health` - Service health status

#### Tasks

- **GET** `/tasks` - List all tasks
  - Query params: `status`, `priority`, `projectId`, `limit`, `offset`
  - Returns: Array of tasks
- **POST** `/tasks` - Create new task
  - Body: `{ title, description?, status?, priority?, projectId?, assigneeId? }`
  - Validates project access if projectId provided
  - Returns: Created task
  - Event: `task.created` published
- **GET** `/tasks/:id` - Get task by ID
  - Returns: Task details with project info (if applicable)
- **PATCH** `/tasks/:id` - Update task
  - Body: `{ title?, description?, status?, priority?, assigneeId? }`
  - Returns: Updated task
  - Event: `task.updated` published
- **DELETE** `/tasks/:id` - Delete task
  - Returns: Success confirmation
  - Event: `task.deleted` published

#### Statistics

- **GET** `/tasks/statistics` - Get task statistics
  - Query params: `projectId?`
  - Returns: Total count, status breakdown, completion rate

### gRPC API

Service: `TaskService` on port `50052`

**Proto definition:** See `/proto/task.proto`

#### Methods

**GetTasksByProject** - Retrieve all tasks for a project

- Request: `{ projectId, status?, priority? }`
- Response: `{ tasks: [{ id, title, description, status, priority, assigneeId, projectId, createdAt, updatedAt }] }`

**GetTaskStatistics** - Get task statistics for a project

- Request: `{ projectId }`
- Response: `{ total, byStatus: {}, completionRate }`

**DeleteTasksByProject** - Cascade delete all tasks in a project

- Request: `{ projectId }`
- Response: `{ deletedCount }`

**CountTasksByProject** - Get task count for a project

- Request: `{ projectId }`
- Response: `{ count }`

**GetTaskById** - Retrieve single task

- Request: `{ taskId }`
- Response: `{ task: { ... } }`

## Event Publishing (RabbitMQ)

The service publishes events for task-related actions.

### Published Events

**Exchange:** `task_events` (topic exchange)

**Events:**

- `task.created` - New task created
  - Routing key: `task.created`
  - Payload: `{ taskId, title, status, projectId?, assigneeId?, timestamp }`

- `task.updated` - Task modified
  - Routing key: `task.updated`
  - Payload: `{ taskId, changes, timestamp }`

- `task.deleted` - Task deleted
  - Routing key: `task.deleted`
  - Payload: `{ taskId, projectId?, timestamp }`

- `task.status.changed` - Task status changed
  - Routing key: `task.status.changed`
  - Payload: `{ taskId, oldStatus, newStatus, projectId?, timestamp }`

- `task.assigned` - Task assigned to user
  - Routing key: `task.assigned`
  - Payload: `{ taskId, assigneeId, projectId?, timestamp }`

## Authentication

See [AUTHENTICATION.md](../AUTHENTICATION.md) for detailed authentication architecture.

### Current Implementation

- JWT-based authentication planned
- Token validation middleware (example in `middlewares/`)
- User context extraction from tokens
- Service-to-service authentication via gRPC metadata

### Future Enhancement

- mTLS for production (see [MTLS_ARCHITECTURE.md](../MTLS_ARCHITECTURE.md))
- Integration with Asgardeo (WSO2) identity provider

## Database & Migrations

### Schema

**Table:** `tasks`

- `id` - UUID primary key
- `title` - Task title (string, required)
- `description` - Task description (text, optional)
- `status` - Task status (enum: todo, in_progress, done, cancelled)
- `priority` - Task priority (enum: low, medium, high, urgent)
- `assignee_id` - Assigned user ID (UUID, optional)
- `project_id` - Associated project ID (UUID, optional, foreign key to project-service)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Running Migrations

List pending migrations:

```bash
pnpm migration:list
```

Run migrations:

```bash
pnpm migration:run
```

Rollback last migration:

```bash
pnpm migration:rollback
```

Create new migration:

```bash
pnpm migration:create <migration-name>
```

## Development

### Project Structure

```
task-service/
├── src/
│   ├── app.ts                 # Express app setup
│   ├── server.ts              # Entry point, starts HTTP & gRPC
│   ├── config/                # Configuration management
│   │   ├── index.ts          # Main config
│   │   ├── database.ts       # Knex database config
│   │   └── ormconfig.ts      # Database connection
│   ├── controllers/          # HTTP request handlers
│   │   └── task.controller.ts
│   ├── services/             # Business logic
│   │   └── task.service.ts
│   ├── models/               # Database models
│   │   └── task.model.ts
│   ├── routes/               # API route definitions
│   │   ├── index.ts
│   │   └── task.routes.ts
│   ├── validations/          # Joi validation schemas
│   │   └── task.validation.ts
│   ├── grpc/                 # gRPC implementation
│   │   ├── server.ts         # gRPC server setup
│   │   └── clients/
│   │       └── project.grpc.client.ts
│   ├── messaging/            # RabbitMQ event bus
│   │   ├── EventBus.ts
│   │   └── index.ts
│   ├── middlewares/          # Express middleware
│   │   ├── errorHandler.ts
│   │   └── validate.ts
│   ├── migrations/           # Database migrations
│   │   ├── v1_initial_schema.ts
│   │   └── v2_add_project_id_to_tasks.ts
│   ├── utils/                # Utilities
│   │   ├── logger.ts
│   │   ├── ApiError.ts
│   │   └── catchAsync.ts
│   └── types/                # TypeScript definitions
│       ├── express.d.ts
│       └── grpc.types.ts
├── package.json
├── tsconfig.json
├── docker-compose.yml
├── Dockerfile
└── README.md
```

### Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build TypeScript to JavaScript
- `pnpm start` - Start production server
- `pnpm test` - Run tests with Jest
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Generate test coverage report
- `pnpm lint` - Lint code with ESLint
- `pnpm lint:fix` - Fix linting issues
- `pnpm format` - Format code with Prettier
- `pnpm migration:create` - Create new migration
- `pnpm migration:run` - Run pending migrations
- `pnpm migration:rollback` - Rollback last migration
- `pnpm migration:list` - List migrations
- `pnpm proto:generate` - Generate TypeScript from proto files

### Environment Variables

Create `.env` file based on `.env.example`:

```env
# Server
NODE_ENV=development
PORT=3000
API_VERSION=v1
SERVICE_NAME=task-service
LOG_LEVEL=debug

# gRPC
GRPC_PORT=50052
PROJECT_SERVICE_GRPC_URL=localhost:50051

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskdb
DB_USER=taskuser
DB_PASSWORD=taskpass
DB_POOL_MIN=2
DB_POOL_MAX=10

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
```

## Testing

### Running Tests

Run all tests:

```bash
pnpm test
```

Run with coverage:

```bash
pnpm test:coverage
```

Watch mode for development:

```bash
pnpm test:watch
```

### Test Structure

Tests are located in `src/__tests__/`:

- Integration tests for task APIs
- Unit tests for services and utilities

## Deployment

### Docker Build

Build image:

```bash
docker build -t task-service:latest .
```

Run container:

```bash
docker run -p 3000:3000 -p 50052:50052 \
  -e DB_HOST=host.docker.internal \
  -e RABBITMQ_URL=amqp://admin:admin123@host.docker.internal:5672 \
  task-service:latest
```

### Multi-Service Deployment

Use the root `docker-compose.yml` to run all services together:

```bash
cd /home/dasunp/Projects/ws02
docker-compose up -d
```

## Related Documentation

- [Root README](../README.md) - Overall architecture and quick start
- [AUTHENTICATION.md](../AUTHENTICATION.md) - Authentication architecture
- [MTLS_ARCHITECTURE.md](../MTLS_ARCHITECTURE.md) - mTLS implementation details
- [MESSAGING.md](../MESSAGING.md) - Event-driven architecture patterns
- [Proto README](../proto/README.md) - gRPC service definitions

## Troubleshooting

### Database Connection Issues

Check if PostgreSQL is running:

```bash
docker-compose ps task-postgres
```

Check logs:

```bash
docker-compose logs task-postgres
```

Verify connection:

```bash
docker-compose exec task-postgres psql -U taskuser -d taskdb
```

### gRPC Connection Issues

Verify Project Service is running:

```bash
curl http://localhost:3001/api/v1/health
```

Check gRPC port:

```bash
netstat -an | grep 50051
```

### RabbitMQ Issues

Check RabbitMQ management UI:

```
http://localhost:15672
Username: admin
Password: admin123
```

Verify exchange and queues exist.

### View Service Logs

```bash
docker-compose logs -f task-service
```

## Contributing

1. Follow TypeScript and ESLint guidelines
2. Write tests for new features
3. Update documentation for API changes
4. Use conventional commits
5. Run linter and tests before committing

## License

MIT
