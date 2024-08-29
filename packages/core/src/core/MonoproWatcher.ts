import { FeatureService } from './services/FeatureService.js';

export class MonoproWatcher {
  private readonly featureService = new FeatureService();

  async watch() {
    const features = await this.featureService.getFeatures();
    console.log('Features:::', features);
  }
}
