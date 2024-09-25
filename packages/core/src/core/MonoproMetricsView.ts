import { DataProcessingService } from './services/DataProcessingService/index.js';

export class MonoproMetricsView {
  private dataProcessingService: DataProcessingService;
  private featureId!: number;
  private lastUpdated: Date;

  constructor(neonUrl: string, featureId: number) {
    this.dataProcessingService = new DataProcessingService(neonUrl);
    this.featureId = featureId;
    this.lastUpdated = new Date();
  }

  public async render(): Promise<string> {
    const { metrics, lastUpdated } =
      await this.dataProcessingService.getMetricsWithTimestamp({
        featureId: this.featureId,
      });
    this.lastUpdated = lastUpdated;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Monopro Metrics</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          h1 { color: #333; }
          .metric-section { margin-bottom: 20px; }
          .metric-section h2 { color: #666; }
          .metric { margin-bottom: 10px; }
          .header { display: flex; justify-content: space-between; align-items: center; }
          .last-updated { font-size: 0.9em; color: #666; }
          .recalculate-btn { padding: 10px 20px; background-color: #007bff; color: white; border: none; cursor: pointer; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Monopro Metrics</h1>
          <div>
            <span id="lastUpdated" class="last-updated">Last updated: ${this.lastUpdated.toLocaleString()}</span>
            <form method="POST">
              <input type="hidden" name="action" value="recalculate">
              <button type="submit" class="recalculate-btn">Recalculate Metrics</button>
            </form>
          </div>
        </div>
        <div id="metricsContent">
          ${this.renderMetricSections(metrics)}
        </div>
      </body>
      </html>
    `;
  }

  private renderMetricSections(groupedMetrics: Record<string, any[]>): string {
    return Object.entries(groupedMetrics)
      .map(
        ([type, metrics]) => `
        <div class="metric-section">
          <h2>${type}</h2>
          ${metrics
            .map(
              (metric) => `
            <div class="metric">
              <strong>${metric.name}:</strong> ${metric.value}
            </div>
          `,
            )
            .join('')}
        </div>
      `,
      )
      .join('');
  }

  public async handleRequest(
    method: string,
    body: any,
  ): Promise<string | object> {
    if (method === 'POST' && body?.action === 'recalculate') {
      await this.dataProcessingService.processFeature(this.featureId);
      const { metrics, lastUpdated } =
        await this.dataProcessingService.getMetricsWithTimestamp({
          featureId: this.featureId,
        });
      this.lastUpdated = lastUpdated;
      return {
        metricsHtml: this.renderMetricSections(metrics),
        lastUpdated: this.lastUpdated.toLocaleString(),
      };
    }
    return this.render();
  }
}
