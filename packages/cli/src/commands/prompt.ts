import { Args, Flags } from '@oclif/core';
import BaseCommand from '../utils/base-command.js';
import { AIModelService, FeatureService } from 'monopro-ai';
import { input, select } from '@inquirer/prompts';
import { colorize } from '../utils/colors.js';

export default class PromptCommand extends BaseCommand {
  private featureService!: FeatureService;
  private aiModelService!: AIModelService;

  static override description = 'Manage testing prompts in MonoPro';

  static override flags = {
    promptId: Flags.string({
      char: 'p',
      description: 'Prompt ID for read the content',
    }),
    feature: Flags.string({ char: 'f', description: 'Feature ID' }),
    content: Flags.string({
      char: 'c',
      description: 'Content of the prompt for save',
    }),
    help: Flags.help({ char: 'h', description: 'Show help for the command' }),
  };

  static override args = {
    action: Args.string({
      required: false,
      description: 'Action to perform on the prompt',
      options: ['save', 'read'],
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(PromptCommand);
    this.featureService = await this.initializeService(FeatureService);
    this.aiModelService = await this.initializeService(AIModelService);

    switch (args.action) {
      case 'save':
        let featureId = Number(flags.feature || (await this.selectFeature()));
        await this.savePrompt({
          featureId,
          promptData: flags.content || (await this.inputPrompt()),
        });
        break;
      case 'read':
        let promptId = Number(flags.promptId);
        await this.readPrompt(promptId);
        break;
      default:
        this.log('No action provided.');
    }
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

  private async inputPrompt() {
    return await input({
      message: 'Enter the prompt content:',
    });
  }

  private async savePrompt({
    featureId,
    promptData,
  }: {
    featureId: number;
    promptData: string;
  }) {
    await this.aiModelService.saveAIPrompt(promptData, featureId);
    this.log(colorize(`Prompt saved successfully!`, 'green'));
  }

  private async readPrompt(promptId: number) {
    const promptContent = await this.aiModelService.readAIPrompt(promptId);
    this.log(promptContent);
  }
}
