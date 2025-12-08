import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class V4AddTypeToTasks1700000000004 implements MigrationInterface {
  name = 'V4AddTypeToTasks1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the column already exists
    const table = await queryRunner.getTable('tasks');
    const typeColumn = table?.columns.find((col) => col.name === 'type');

    if (!typeColumn) {
      await queryRunner.addColumn(
        'tasks',
        new TableColumn({
          name: 'type',
          type: 'varchar',
          length: '50',
          default: "'feature'",
          isNullable: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('tasks');
    const typeColumn = table?.columns.find((col) => col.name === 'type');

    if (typeColumn) {
      await queryRunner.dropColumn('tasks', 'type');
    }
  }
}
