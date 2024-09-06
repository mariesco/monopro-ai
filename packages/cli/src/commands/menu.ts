import { select, Separator } from '@inquirer/prompts';
import { colorize } from '../utils/colors.js';
import { listFeatures } from '../utils/menu-actions.js';
import BaseCommand from '../utils/base-command.js';
import {
  AIModelService,
  FeatureService,
  ResponseClassService,
  UseCaseService,
} from 'monopro-ai';

export default class Menu extends BaseCommand {
  private featureService!: FeatureService;
  private responseClassService!: ResponseClassService;
  private aiModelService!: AIModelService;
  private useCaseService!: UseCaseService;

  static override description = 'Main menu for MonoPro CLI';

  public async run(): Promise<void> {
    this.log(colorize('Welcome to MonoPro CLI', 'cyan'));
    this.featureService = await this.initializeService(FeatureService);
    this.responseClassService =
      await this.initializeService(ResponseClassService);
    this.aiModelService = await this.initializeService(AIModelService);
    this.useCaseService = await this.initializeService(UseCaseService);

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
        await listFeatures(this, {
          featureService: this.featureService,
          responseClassService: this.responseClassService,
          aiModelService: this.aiModelService,
          useCaseService: this.useCaseService,
        });
        break;
      case 'exit':
        this.log(colorize('Exiting...', 'red'));
        process.exit(0);
    }

    this.run();
  }
}
