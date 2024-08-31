import { FeatureService } from './services/FeatureService.js';

export class MonoproWatcher {
  featureService = new FeatureService(process.env.NEON_URL!);

  async watch() {
    const features = await this.featureService.getFeatures();
    console.log('Features:::', features);
    return features;
  }
}
