import { AIStringTable } from '../../shared/models/drizzle_schema.js';
import { db } from '../../shared/utils/Database.js';

export class FeatureService {
  // async createFeature(featureData: Feature): Promise<Feature> {
  //   const feature = FeatureSchema.parse(featureData);
  //   await db.insert('features').values(feature);
  //   return feature;
  // }
  //
  // async getFeatureById(id: string): Promise<Feature | null> {
  //   const feature = await db.select().from('features').where({ id }).first();
  //   return feature || null;
  // }

  // async getFeatures(): Promise<Feature[]> {
  async getFeatures(): Promise<string> {
    const features = await db.select().from(AIStringTable);
    console.log('Tenemos los ffffffeatures', features);
    // return features;
    return 'Hola respuesta';
  }

  // Otros métodos necesarios...
}
