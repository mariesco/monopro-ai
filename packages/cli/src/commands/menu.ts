import { Command } from '@oclif/core';
import { select, Separator } from '@inquirer/prompts';

export default class Menu extends Command {
  static override description =
    'Comando inicial para seleccionar y ejecutar acciones en MonoPro';

  public async run(): Promise<void> {
    this.log('Bienvenido a MonoPro CLI');

    const action = await select({
      message: 'Qué te gustaría hacer?',
      choices: [
        {
          name: 'Crear un feature',
          value: 'createFeature',
          description: 'Crear un nuevo feature',
        },
        {
          name: 'Listar features',
          value: 'listFeatures',
          description: 'Ver todos los features existentes',
        },
        new Separator(),
        { name: 'Salir', value: 'exit', description: 'Salir de la CLI' },
      ],
    });

    switch (action) {
      case 'createFeature':
        await this.config.runCommand('create:feature');
        break;
      case 'listFeatures':
        await this.config.runCommand('list:features');
        break;
      case 'exit':
        this.log('Saliendo...');
        process.exit(0);
    }

    this.run(); // Reinicia el menú despues de cada acción
  }
}
