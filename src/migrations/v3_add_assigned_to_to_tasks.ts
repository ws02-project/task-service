import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssignedToToTasksV3 implements MigrationInterface {
  name = 'AddAssignedToToTasks1697200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column already exists
    const result = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='tasks' AND column_name='assigned_to'
    `);

    // Add assigned_to column only if it doesn't exist
    if (result.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "tasks" 
        ADD COLUMN "assigned_to" varchar(255)
      `);
    }

    // Create index on assigned_to for performance (only if column was added)
    if (result.length === 0) {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_tasks_assigned_to" ON "tasks" ("assigned_to")
      `);
    } else {
      // Column exists, but check if index exists
      const indexResult = await queryRunner.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename='tasks' AND indexname='IDX_tasks_assigned_to'
      `);
      if (indexResult.length === 0) {
        await queryRunner.query(`
          CREATE INDEX "IDX_tasks_assigned_to" ON "tasks" ("assigned_to")
        `);
      }
    }

    // Add comment for documentation
    await queryRunner.query(`
      COMMENT ON COLUMN "tasks"."assigned_to" IS 'User ID or email of the person assigned to this task'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index first
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_assigned_to"`);

    // Drop column
    await queryRunner.query(`
      ALTER TABLE "tasks" 
      DROP COLUMN IF EXISTS "assigned_to"
    `);
  }
}
