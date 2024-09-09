import BaseCommand from '../utils/base-command.js';
import { migrateDB } from 'monopro-ai';

export default class Migrate extends BaseCommand {
  static override description = 'Execute the database migrations';

  public async run(): Promise<void> {
    this.log('Starting database migration...');
    try {
      await migrateDB(process.env.NEON_URL!);
      this.log('Database migration completed successfully.');
    } catch (error) {
      this.error(`Error during migration: ${error}`);
    }
  }
}
