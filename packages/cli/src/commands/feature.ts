import { Command, Flags, Args } from '@oclif/core';
import { input, select } from '@inquirer/prompts';

export default class FeatureCommand extends Command {
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

      this.log(`Creating feature: ${name}`);
      this.log(`Description: ${description}`);
      this.log(`Selected model: ${model}`);

      // await saveFeature({ name, description, model });

      this.log('\x1b[32m%s\x1b[0m', 'Feature saved successfully!');
    } else if (args.action === 'list') {
      await this.listFeatures();
    } else if (args.action === 'view') {
      const featureId = flags.name || (await this.selectFeature());
      await this.viewFeature(featureId);
    } else if (args.action === 'delete') {
      const featureId = flags.name || (await this.selectFeature());
      await this.deleteFeature(featureId);
    } else {
      this.log('No action provided.');
    }
  }

  private async listFeatures() {
    const features = ['Feature A', 'Feature B', 'Feature C'];
    this.log('Listing features:');
    features.forEach((feature) => this.log(feature));
  }

  private async selectFeature() {
    const features = ['Feature A', 'Feature B', 'Feature C'];
    return await select({
      message: 'Select a feature:',
      choices: features.map((feature) => ({ name: feature, value: feature })),
    });
  }

  private async viewFeature(featureId: string) {
    this.log(`Viewing details for feature: ${featureId}`);
    this.log('Feature details...');
  }

  private async deleteFeature(featureId: string) {
    this.log(`Deleting feature: ${featureId}`);
    this.log('Feature deleted.');
  }
}
