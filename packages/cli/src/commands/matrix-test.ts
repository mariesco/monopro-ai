import { Flags } from '@oclif/core';
import { select } from '@inquirer/prompts';
import { DataProcessingService, FeatureService } from 'monopro-ai';
import BaseCommand from '../utils/base-command.js';

export default class TestCommand extends BaseCommand {
  private featureService!: FeatureService;
  private dataProcessingService!: DataProcessingService;

  static override description = 'Run tests for a feature in MonoPro';

  static override flags = {
    feature: Flags.string({ char: 'f', description: 'Feature ID' }),
  };

  public async run(): Promise<void> {
    this.dataProcessingService = await this.initializeService(
      DataProcessingService,
    );

    const { flags } = await this.parse(TestCommand);

    const featureId = flags.feature || (await this.selectFeature());
    await this.dataProcessingService.processFeature(
      Number(featureId),
      (progress) => {
        this.updateProgressBar(progress.stage, progress.progress);
      },
    );
    this.log('\nProcess completed.');
  }

  private updateProgressBar(stage: string, progress: number) {
    const dots = '.'.repeat((progress % 3) + 1);
    this.log(`\r${stage} ${dots.padEnd(3)} ${progress}%`);
  }

  private async selectFeature() {
    this.featureService = await this.initializeService(FeatureService);
    const features = await this.featureService.getFeatures();
    return await select({
      message: 'Select a feature:',
      choices: features.map((feature) => ({
        name: feature.name,
        value: feature.id,
      })),
    });
  }
}
