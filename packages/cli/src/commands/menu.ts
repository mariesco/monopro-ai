import { Command } from '@oclif/core';
import { select, Separator } from '@inquirer/prompts';
import { colorize } from '../utils/colors.js';
import { listFeatures, handleFeatureAction } from '../utils/menu-actions.js';

export default class Menu extends Command {
  static override description = 'Main menu for MonoPro CLI';

  public async run(): Promise<void> {
    this.log(colorize('Welcome to MonoPro CLI', 'cyan'));

    const action = await select({
      message: colorize('What would you like to do?', 'yellow'),
      choices: [
        {
          name: 'Create a feature',
          value: 'createFeature',
          description: 'Create a new feature',
        },
        {
          name: 'List features',
          value: 'listFeatures',
          description: 'View all existing features',
        },
        new Separator(),
        { name: 'Exit', value: 'exit', description: 'Exit the CLI' },
      ],
    });

    switch (action) {
      case 'createFeature':
        await this.config.runCommand('feature', ['create']);
        break;
      case 'listFeatures':
        await listFeatures(this);
        break;
      case 'exit':
        this.log(colorize('Exiting...', 'red'));
        process.exit(0);
    }

    this.run(); // Reinicia el men� despu�s de cada acci�n
  }
}
