import { Command } from '@oclif/core';
import { input, select } from '@inquirer/prompts';

export default class CreateFeature extends Command {
  static override description =
    'This command is for creating a feature on Monopro';

  private models = ['Model A', 'Model B', 'Model C', 'Model D'];

  public async run(): Promise<void> {
    const name = await input({ message: 'Please enter the feature name:' });
    const description = await input({
      message: 'Please enter the feature description:',
    });
    const model = await select({
      message: 'Please select a model:',
      choices: this.models.map((model) => ({ name: model, value: model })),
    });

    this.log(`Creating feature: ${name}`);
    this.log(`Description: ${description}`);
    this.log(`Selected model: ${model}`);

    //TODO: Add integration with core package
    // saveFeature({ name, description, model });
    this.log('Feature saved successfully!');
  }
}
