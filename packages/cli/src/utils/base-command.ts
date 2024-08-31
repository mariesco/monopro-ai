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

        this.log('-----Variables de entorno cargadas correctamente');
      } else {
        this.warn('Archivo .env no encontrado');
      }
    } catch (error: any) {
      this.error(`Error al cargar el archivo .env: ${error.message}`);
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
        throw new Error(
          `No se pudo encontrar el servicio ${ServiceClass.name} en el m�dulo.`,
        );
      }

      const serviceInstance = new Service(process.env.NEON_URL!);
      this.log(`${ServiceClass.name} inicializado correctamente.`);
      return serviceInstance;
    } catch (error) {
      throw error;
    }
  }
}
