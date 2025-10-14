import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchemaV1 implements MigrationInterface {
  name = 'InitialSchema1697000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(255) NOT NULL,
        "description" text,
        "status" character varying(50) NOT NULL DEFAULT 'pending',
        "priority" character varying(50) NOT NULL DEFAULT 'medium',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tasks" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_status" CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
        CONSTRAINT "CHK_priority" CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tasks_status" ON "tasks" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tasks_created_at" ON "tasks" ("created_at" DESC)
    `);

    // Insert sample data
    await queryRunner.query(`
      INSERT INTO "tasks" ("title", "description", "status", "priority") VALUES
        ('Setup Development Environment', 'Install Docker, Node.js, and PostgreSQL', 'completed', 'high'),
        ('Create API Documentation', 'Document all REST endpoints with examples', 'in_progress', 'medium'),
        ('Write Unit Tests', 'Add comprehensive test coverage for all services', 'pending', 'high'),
        ('Setup CI/CD Pipeline', 'Configure GitHub Actions for automated testing', 'pending', 'medium')
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tasks"`);
  }
}
