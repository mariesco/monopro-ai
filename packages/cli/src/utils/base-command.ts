import { Command, type Config } from '@oclif/core';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

export default abstract class BaseCommand extends Command {
  constructor(argv: string[], config: Config) {
    super(argv, config);
    this.loadEnvSync();
  }

  protected loadEnvSync() {
    const envPath = path.resolve(process.cwd(), '.env');

    try {
      if (fs.existsSync(envPath)) {
        const envConfig = dotenv.parse(fs.readFileSync(envPath));
        for (const key in envConfig) {
          process.env[key] = envConfig[key];
        }
      } else {
        this.warn('File .env not found');
      }
    } catch (error) {
      this.error(`Error on load file .env: ${error}`);
    }
  }

  protected async initializeService<T>(ServiceClass: {
    new (...args: any[]): T;
  }): Promise<T> {
    try {
      const mpro = await import('monopro-ai');
      const Service = mpro[ServiceClass.name as keyof typeof mpro] as {
        new (...args: any[]): T;
      };

      if (!Service) {
        throw new Error(`Not found service ${ServiceClass.name} in module.`);
      }

      const serviceInstance = new Service(process.env.NEON_URL!);
      return serviceInstance;
    } catch (error) {
      throw error;
    }
  }
}
