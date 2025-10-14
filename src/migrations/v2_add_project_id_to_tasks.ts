import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectIdToTasksV2 implements MigrationInterface {
  name = 'AddProjectIdToTasks1697100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add project_id column (nullable for existing tasks)
    await queryRunner.query(`
      ALTER TABLE "tasks" 
      ADD COLUMN "project_id" uuid
    `);

    // Create index on project_id for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_tasks_project_id" ON "tasks" ("project_id")
    `);

    // Add comment for documentation
    await queryRunner.query(`
      COMMENT ON COLUMN "tasks"."project_id" IS 'Foreign key reference to project service'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index first
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_project_id"`);

    // Drop column
    await queryRunner.query(`
      ALTER TABLE "tasks" 
      DROP COLUMN IF EXISTS "project_id"
    `);
  }
}
