import { Flags, Args } from '@oclif/core';
import { input, select } from '@inquirer/prompts';
import BaseCommand from '../utils/base-command.js';
import { FeatureService, ResponseClassService } from 'monopro-ai';
import { colorize } from '../utils/colors.js';

export default class ResponseClassCommand extends BaseCommand {
  private responseClassService!: ResponseClassService;
  private featureService!: FeatureService;

  static override description =
    'Manage response classes for a feature in MonoPro';

  static override flags = {
    feature: Flags.string({ char: 'f', description: 'Feature ID' }),
    name: Flags.string({ char: 'n', description: 'Response class name' }),
    description: Flags.string({
      char: 'd',
      description: 'Response class description',
    }),
    id: Flags.string({
      char: 'i',
      description: 'Response class ID who want to edit or delete',
    }),
    help: Flags.help({ char: 'h', description: 'Show help for the command' }),
  };

  static override args = {
    action: Args.string({
      required: false,
      description: 'Action to perform on the response class',
      options: ['create', 'list', 'delete', 'edit'],
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ResponseClassCommand);
    this.responseClassService =
      await this.initializeService(ResponseClassService);
    this.featureService = await this.initializeService(FeatureService);

    if (args.action === 'create' || !args.action) {
      const className =
        flags.name || (await input({ message: 'Enter the class name:' }));
      const classDescription =
        flags.description ||
        (await input({ message: 'Enter the class description:' }));
      const featureId = Number(flags.feature || (await this.selectFeature()));

      await this.responseClassService.createResponseClass({
        name: className,
        description: classDescription,
        featureId: featureId,
      });

      this.log('\x1b[32m%s\x1b[0m', 'Response class saved successfully!');
    } else if (args.action === 'list') {
      const featureId = Number(flags.feature || (await this.selectFeature()));
      await this.listResponseClasses(featureId);
    } else if (args.action === 'edit') {
      const featureId = Number(flags.feature || (await this.selectFeature()));
      let responseClassSelected;

      if (!flags.id) {
        responseClassSelected = await this.selectResponseClass(featureId);
      } else {
        responseClassSelected =
          await this.responseClassService.getResponseClassById(
            Number(flags.id),
          );

        if (!responseClassSelected) {
          this.log(colorize('No response class found with this ID.', 'red'));
          return;
        }
      }

      const newResponseClassName =
        flags.name ||
        (await input({
          message: `Enter new name for response class ${responseClassSelected.name}:`,
        }));
      const newResponseClassDescription =
        flags.description ||
        (await input({
          message: `Enter new description for response class ${responseClassSelected.description}:`,
        }));

      await this.responseClassService.updateResponseClass(
        responseClassSelected.id,
        {
          name: newResponseClassName,
          description: newResponseClassDescription,
          featureId: featureId,
        },
      );

      this.log(
        colorize(
          `Successfully updated response class ${responseClassSelected.name}`,
          'green',
        ),
      );
    } else if (args.action === 'delete') {
      let responseClassSelected;
      if (!flags.id) {
        const featureId = Number(flags.feature || (await this.selectFeature()));
        responseClassSelected = await this.selectResponseClass(featureId);
      } else {
        responseClassSelected =
          await this.responseClassService.getResponseClassById(
            Number(flags.id),
          );
        if (!responseClassSelected) {
          this.log(colorize('No response class found with this ID.', 'red'));
          return;
        }
      }
      await this.responseClassService.deleteResponseClass(
        responseClassSelected.id,
      );
      this.log(
        colorize(
          `Successfully deleted response class ${responseClassSelected.name}`,
          'green',
        ),
      );
    } else {
      this.log('No action provided.');
    }
  }

  private async selectFeature() {
    const features = await this.featureService.getFeatures();
    return await select({
      message: 'Select a feature for viewing response classes:',
      choices: features.map((feature) => ({
        name: feature.name,
        value: feature.id,
      })),
    });
  }

  private async listResponseClasses(featureId: number) {
    this.log(`Listing response classes for feature ${featureId}:`);
    const responseClass = await this.selectResponseClass(featureId);
    if (responseClass) {
      this.log(`${colorize('ID', 'green')}: ${responseClass.id}`);
      this.log(`${colorize('Name', 'green')}: ${responseClass.name}`);
      this.log(
        `${colorize('Description', 'green')}: ${responseClass.description}`,
      );
      this.log(`${colorize('Model', 'green')}: ${responseClass.featureId}`);
    }
  }

  private async selectResponseClass(featureId: number) {
    const responseClasses =
      await this.responseClassService.getResponseClassesByFeatureId(featureId);
    return await select({
      message: `Select a response class:`,
      choices: responseClasses.map((rc) => ({ name: rc.name, value: rc })),
    });
  }
}
