import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertAssignedToUuidV5 implements MigrationInterface {
  name = 'ConvertAssignedToUuid1702834800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column exists and what type it is
    const result = await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name='tasks' AND column_name='assigned_to'
    `);

    if (result.length === 0) {
      // Column doesn't exist, create it as UUID
      await queryRunner.query(`
        ALTER TABLE "tasks" 
        ADD COLUMN "assigned_to" uuid
      `);
    } else if (result[0].data_type === 'character varying') {
      // Column exists as VARCHAR, need to convert
      // First, clean up any invalid data (non-UUID values)
      await queryRunner.query(`
        UPDATE "tasks" 
        SET "assigned_to" = NULL 
        WHERE "assigned_to" IS NOT NULL 
        AND "assigned_to" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      `);

      // Convert column type to UUID
      await queryRunner.query(`
        ALTER TABLE "tasks" 
        ALTER COLUMN "assigned_to" TYPE uuid USING "assigned_to"::uuid
      `);
    }

    // Ensure index exists on assigned_to for performance
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

    // Update comment for documentation
    await queryRunner.query(`
      COMMENT ON COLUMN "tasks"."assigned_to" IS 'UUID of the user assigned to this task (references users.id)'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Convert back to VARCHAR for rollback
    await queryRunner.query(`
      ALTER TABLE "tasks" 
      ALTER COLUMN "assigned_to" TYPE varchar(255) USING "assigned_to"::varchar
    `);
  }
}
