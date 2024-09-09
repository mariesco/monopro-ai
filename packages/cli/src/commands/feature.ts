import { Flags, Args } from '@oclif/core';
import { input, select } from '@inquirer/prompts';
import { FeatureService } from 'monopro-ai';

import { colorize } from '../utils/colors.js';
import BaseCommand from '../utils/base-command.js';

export default class FeatureCommand extends BaseCommand {
  private featureService!: FeatureService;
  static override description = 'Manage features in MonoPro';

  static override flags = {
    name: Flags.string({ char: 'n', description: 'Name of the feature' }),
    description: Flags.string({
      char: 'd',
      description: 'Description of the feature',
    }),
    model: Flags.string({
      char: 'm',
      description: 'Model to use for the feature',
    }),
    url: Flags.string({
      char: 'u',
      description: 'URL of the feature',
    }),
    help: Flags.help({ char: 'h', description: 'Show help for the command' }),
  };

  static override args = {
    action: Args.string({
      required: false,
      description: 'Action to perform on the feature',
      options: ['create', 'list', 'delete', 'view'],
    }),
  };

  private models = ['Model A', 'Model B', 'Model C', 'Model D'];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(FeatureCommand);
    this.featureService = await this.initializeService(FeatureService);

    if (args.action === 'create' || !args.action) {
      const name =
        flags.name || (await input({ message: 'Enter the feature name:' }));
      const description =
        flags.description ||
        (await input({ message: 'Enter the feature description:' }));
      const model =
        flags.model ||
        (await select({
          message: 'Select a model:',
          choices: this.models.map((model) => ({ name: model, value: model })),
        }));
      const url =
        flags.url || (await input({ message: 'Enter the feature URL:' }));

      this.log(`Creating feature: ${name}`);
      this.log(`Description: ${description}`);
      this.log(`Selected model: ${model}`);
      this.log(`URL: ${url}`);

      await this.featureService.createFeature({
        name,
        description,
        model,
        url,
      });

      this.log('\x1b[32m%s\x1b[0m', 'Feature saved successfully!');
    } else if (args.action === 'list') {
      await this.listFeatures();
    } else if (args.action === 'view') {
      const featureId = await this.selectFeature();
      await this.viewFeature(featureId);
    } else if (args.action === 'delete') {
      const featureId = await this.selectFeature();
      await this.deleteFeature(featureId);
    } else {
      this.log('No action provided.');
    }
  }

  private async listFeatures() {
    const features = await this.featureService.getFeatures();
    features.forEach((feature) => this.log(feature.name));
  }

  private async selectFeature() {
    const features = await this.featureService.getFeatures();
    return await select({
      message: 'Select a feature:',
      choices: features.map((feature) => ({
        name: feature.name,
        value: feature.id,
      })),
    });
  }

  private async viewFeature(featureId: number) {
    this.log(`Viewing details for feature: ${featureId}`);
    this.log('Feature details ==>');
    // TODO: Implement view feature
    const feature = await this.featureService.getFeatureById(featureId);
    if (feature) {
      this.log(`${colorize('ID', 'green')}: ${feature.id}`);
      this.log(`${colorize('Name', 'green')}: ${feature.name}`);
      this.log(`${colorize('Description', 'green')}: ${feature.description}`);
      this.log(`${colorize('Model', 'green')}: ${feature.model}`);
    }
  }

  private async deleteFeature(featureId: number) {
    this.log(`Deleting feature: ${featureId}`);
    await this.featureService.deleteFeature(featureId);
    this.log('Feature deleted.');
  }
}
