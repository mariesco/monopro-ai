import Sentiment from 'sentiment';
import type {
  SelectConfusionMatrix,
  ConfusionMatrixResult,
} from '../../../shared/models/ConfusionMatrix.js';
import type { InsertMetric } from '../../../shared/models/Metrics.js';

type InsertMetricWithoutFeatureId = Omit<InsertMetric, 'featureId'>;

//TODO: Refactor this class to use the /MetricsCalculator/MetricCalculatorFactory.ts
export class MetricsCalculator {
  async calculateMetrics(
    confusionMatrixResult: {
      confusionMatrix: SelectConfusionMatrix[];
      generatedTexts: { id: string; text: string }[];
      expectedTexts: { id: string; text: string }[];
    },
    modelInfo?: ModelInfo,
    userFeedback?: UserFeedback,
    regressionData?: RegressionData,
  ): Promise<InsertMetricWithoutFeatureId[]> {
    const metrics: InsertMetricWithoutFeatureId[] = [];

    metrics.push(
      ...this.calculatePrecisionMetrics(confusionMatrixResult.confusionMatrix),
    );
    metrics.push(...this.calculateSentimentAccuracy(confusionMatrixResult));
    metrics.push(...this.calculateResponseConsistency(confusionMatrixResult));
    metrics.push(
      ...this.calculateTextQualityMetrics(
        confusionMatrixResult.generatedTexts,
        confusionMatrixResult.expectedTexts,
      ),
    );
    metrics.push(
      ...this.calculateRelevanceMetrics(
        confusionMatrixResult.generatedTexts,
        confusionMatrixResult.expectedTexts,
      ),
    );

    if (modelInfo) {
      metrics.push(...this.calculateResponseTime(modelInfo));
      metrics.push(...this.calculatePerformanceMetrics(modelInfo));
      metrics.push(...this.calculateInterpretabilityMetrics(modelInfo));
      metrics.push(...this.calculateRobustnessMetrics(modelInfo));
      metrics.push(...this.calculateGeneralizationMetrics(modelInfo));
      metrics.push(...this.calculateEfficiencyMetrics(modelInfo));
      metrics.push(...this.calculateDiversityAndFairnessMetrics(modelInfo));
      metrics.push(...this.calculateRiskMetrics(modelInfo));
      metrics.push(...this.calculateDevelopmentMetrics(modelInfo));
      metrics.push(...this.calculateEthicalMetrics(modelInfo));
      metrics.push(...this.calculateSecurityMetrics(modelInfo));
    }

    if (userFeedback) {
      metrics.push(...this.calculateUserExperienceMetrics(userFeedback));
    }

    if (regressionData) {
      metrics.push(...this.calculateRegressionMetrics(regressionData));
    }

    return metrics;
  }

  private calculatePrecisionMetrics(
    confusionMatrix: SelectConfusionMatrix[],
  ): InsertMetricWithoutFeatureId[] {
    let totalTP = 0,
      totalFP = 0,
      totalTN = 0,
      totalFN = 0;
    for (const cm of confusionMatrix) {
      totalTP += cm.truePositives;
      totalFP += cm.falsePositives;
      totalTN += cm.trueNegatives;
      totalFN += cm.falseNegatives;
    }
    const total = totalTP + totalFP + totalTN + totalFN;

    const accuracy = ((totalTP + totalTN) / total) * 100;
    const precision = (totalTP / (totalTP + totalFP)) * 100;
    const recall = (totalTP / (totalTP + totalFN)) * 100;
    const f1Score = (2 * precision * recall) / (precision + recall);
    const rocAuc = this.calculateRocAuc(confusionMatrix);
    const logLoss = this.calculateLogLoss(confusionMatrix);

    return [
      {
        name: 'Accuracy',
        value: accuracy.toFixed(2) + '%',
        type: 'classification',
      },
      {
        name: 'Precision',
        value: precision.toFixed(2) + '%',
        type: 'classification',
      },
      {
        name: 'Recall',
        value: recall.toFixed(2) + '%',
        type: 'classification',
      },
      { name: 'F1-Score', value: f1Score.toFixed(2), type: 'classification' },
      { name: 'ROC-AUC', value: rocAuc.toFixed(2), type: 'classification' },
      { name: 'Log Loss', value: logLoss.toFixed(2), type: 'classification' },
    ];
  }

  private calculatePerformanceMetrics(
    modelInfo: ModelInfo,
  ): InsertMetricWithoutFeatureId[] {
    const metrics: InsertMetricWithoutFeatureId[] = [];
    if (modelInfo.latency !== undefined)
      metrics.push({
        name: 'Latency',
        value: modelInfo.latency.toFixed(2) + 'ms',
        type: 'performance',
      });
    if (modelInfo.throughput !== undefined)
      metrics.push({
        name: 'Throughput',
        value: modelInfo.throughput.toFixed(2) + '/s',
        type: 'performance',
      });
    if (modelInfo.inferenceTime !== undefined)
      metrics.push({
        name: 'Inference Time',
        value: modelInfo.inferenceTime.toFixed(2) + 'ms',
        type: 'performance',
      });
    if (modelInfo.trainingTime !== undefined)
      metrics.push({
        name: 'Training Time',
        value: modelInfo.trainingTime.toFixed(2) + 's',
        type: 'performance',
      });
    if (modelInfo.memoryUsage !== undefined)
      metrics.push({
        name: 'Memory Usage',
        value: modelInfo.memoryUsage.toFixed(2) + 'MB',
        type: 'performance',
      });
    if (modelInfo.diskUsage !== undefined)
      metrics.push({
        name: 'Disk Usage',
        value: modelInfo.diskUsage.toFixed(2) + 'MB',
        type: 'performance',
      });
    return metrics;
  }

  private calculateInterpretabilityMetrics(
    modelInfo: ModelInfo,
  ): InsertMetricWithoutFeatureId[] {
    const metrics: InsertMetricWithoutFeatureId[] = [];
    if (modelInfo.featureImportance !== undefined)
      metrics.push({
        name: 'Feature Importance',
        value: JSON.stringify(modelInfo.featureImportance),
        type: 'interpretability',
      });
    if (modelInfo.shapValues !== undefined)
      metrics.push({
        name: 'SHAP Values',
        value: JSON.stringify(modelInfo.shapValues),
        type: 'interpretability',
      });
    if (modelInfo.limeExplanation !== undefined)
      metrics.push({
        name: 'LIME',
        value: JSON.stringify(modelInfo.limeExplanation),
        type: 'interpretability',
      });
    if (modelInfo.modelTransparency !== undefined)
      metrics.push({
        name: 'Model Transparency',
        value: modelInfo.modelTransparency.toFixed(2),
        type: 'interpretability',
      });
    return metrics;
  }

  private calculateRobustnessMetrics(
    modelInfo: ModelInfo,
  ): InsertMetricWithoutFeatureId[] {
    const metrics: InsertMetricWithoutFeatureId[] = [];
    if (modelInfo.adversarialRobustness !== undefined)
      metrics.push({
        name: 'Adversarial Robustness',
        value: modelInfo.adversarialRobustness.toFixed(2),
        type: 'robustness',
      });
    if (modelInfo.stability !== undefined)
      metrics.push({
        name: 'Stability',
        value: modelInfo.stability.toFixed(2),
        type: 'robustness',
      });
    if (modelInfo.resilience !== undefined)
      metrics.push({
        name: 'Resilience',
        value: modelInfo.resilience.toFixed(2),
        type: 'robustness',
      });
    return metrics;
  }

  private calculateGeneralizationMetrics(
    modelInfo: ModelInfo,
  ): InsertMetricWithoutFeatureId[] {
    const metrics: InsertMetricWithoutFeatureId[] = [];
    if (modelInfo.crossValidationScore !== undefined)
      metrics.push({
        name: 'Cross-validation Score',
        value: modelInfo.crossValidationScore.toFixed(2),
        type: 'generalization',
      });
    if (modelInfo.biasVarianceTradeoff !== undefined)
      metrics.push({
        name: 'Bias-Variance Tradeoff',
        value: modelInfo.biasVarianceTradeoff.toFixed(2),
        type: 'generalization',
      });
    if (modelInfo.overfittingUnderfittingDetection !== undefined)
      metrics.push({
        name: 'Overfitting/Underfitting Detection',
        value: modelInfo.overfittingUnderfittingDetection,
        type: 'generalization',
      });
    return metrics;
  }

  private calculateEfficiencyMetrics(
    modelInfo: ModelInfo,
  ): InsertMetricWithoutFeatureId[] {
    const metrics: InsertMetricWithoutFeatureId[] = [];
    if (modelInfo.energyConsumption !== undefined)
      metrics.push({
        name: 'Energy Consumption',
        value: modelInfo.energyConsumption.toFixed(2) + 'kWh',
        type: 'efficiency',
      });
    if (modelInfo.carbonFootprint !== undefined)
      metrics.push({
        name: 'Carbon Footprint',
        value: modelInfo.carbonFootprint.toFixed(2) + 'kgCO2e',
        type: 'efficiency',
      });
    if (modelInfo.modelSize !== undefined)
      metrics.push({
        name: 'Model Size',
        value: modelInfo.modelSize.toFixed(2) + 'MB',
        type: 'efficiency',
      });
    if (modelInfo.parameterEfficiency !== undefined)
      metrics.push({
        name: 'Parameter Efficiency',
        value: modelInfo.parameterEfficiency.toFixed(2),
        type: 'efficiency',
      });
    return metrics;
  }

  private calculateUserExperienceMetrics(
    userFeedback: UserFeedback,
  ): InsertMetricWithoutFeatureId[] {
    const metrics: InsertMetricWithoutFeatureId[] = [];
    if (userFeedback.satisfaction !== undefined)
      metrics.push({
        name: 'User Satisfaction',
        value: userFeedback.satisfaction.toFixed(2),
        type: 'user_experience',
      });
    if (userFeedback.explainabilityRating !== undefined)
      metrics.push({
        name: 'Model Explainability',
        value: userFeedback.explainabilityRating.toFixed(2),
        type: 'user_experience',
      });
    if (userFeedback.easeOfUseRating !== undefined)
      metrics.push({
        name: 'Ease of Use',
        value: userFeedback.easeOfUseRating.toFixed(2),
        type: 'user_experience',
      });
    return metrics;
  }

  private calculateDiversityAndFairnessMetrics(
    modelInfo: ModelInfo,
  ): InsertMetricWithoutFeatureId[] {
    const metrics: InsertMetricWithoutFeatureId[] = [];
    if (modelInfo.fairness !== undefined)
      metrics.push({
        name: 'Fairness',
        value: modelInfo.fairness.toFixed(2),
        type: 'diversity_fairness',
      });
    if (modelInfo.biasDetection !== undefined)
      metrics.push({
        name: 'Bias Detection',
        value: modelInfo.biasDetection.toFixed(2),
        type: 'diversity_fairness',
      });
    if (modelInfo.disparateImpact !== undefined)
      metrics.push({
        name: 'Disparate Impact',
        value: modelInfo.disparateImpact.toFixed(2),
        type: 'diversity_fairness',
      });
    return metrics;
  }

  private calculateRiskMetrics(
    modelInfo: ModelInfo,
  ): InsertMetricWithoutFeatureId[] {
    const metrics: InsertMetricWithoutFeatureId[] = [];
    if (modelInfo.riskOfError !== undefined)
      metrics.push({
        name: 'Risk of Error',
        value: modelInfo.riskOfError.toFixed(2),
        type: 'risk',
      });
    if (modelInfo.trustworthiness !== undefined)
      metrics.push({
        name: 'Trustworthiness',
        value: modelInfo.trustworthiness.toFixed(2),
        type: 'risk',
      });
    if (modelInfo.safety !== undefined)
      metrics.push({
        name: 'Safety',
        value: modelInfo.safety.toFixed(2),
        type: 'risk',
      });
    return metrics;
  }

  private calculateDevelopmentMetrics(
    modelInfo: ModelInfo,
  ): InsertMetricWithoutFeatureId[] {
    const metrics: InsertMetricWithoutFeatureId[] = [];
    if (modelInfo.maintainability !== undefined)
      metrics.push({
        name: 'Maintainability',
        value: modelInfo.maintainability.toFixed(2),
        type: 'development',
      });
    if (modelInfo.scalability !== undefined)
      metrics.push({
        name: 'Scalability',
        value: modelInfo.scalability.toFixed(2),
        type: 'development',
      });
    if (modelInfo.reproducibility !== undefined)
      metrics.push({
        name: 'Reproducibility',
        value: modelInfo.reproducibility.toFixed(2),
        type: 'development',
      });
    return metrics;
  }

  private calculateRocAuc(confusionMatrix: SelectConfusionMatrix[]): number {
    // Simulación del cálculo de ROC-AUC
    return Math.random() * 0.5 + 0.5; // Valor entre 0.5 y 1.0
  }

  private calculateLogLoss(confusionMatrix: SelectConfusionMatrix[]): number {
    // Simulación del cálculo de Log Loss
    return Math.random() * 0.5; // Valor entre 0 y 0.5
  }

  private calculateRegressionMetrics(
    regressionData: RegressionData,
  ): InsertMetricWithoutFeatureId[] {
    const metrics: InsertMetricWithoutFeatureId[] = [];
    if (regressionData.mse !== undefined)
      metrics.push({
        name: 'MSE',
        value: regressionData.mse.toFixed(4),
        type: 'regression',
      });
    if (regressionData.rmse !== undefined)
      metrics.push({
        name: 'RMSE',
        value: regressionData.rmse.toFixed(4),
        type: 'regression',
      });
    if (regressionData.mae !== undefined)
      metrics.push({
        name: 'MAE',
        value: regressionData.mae.toFixed(4),
        type: 'regression',
      });
    if (regressionData.r2 !== undefined)
      metrics.push({
        name: 'R-squared',
        value: regressionData.r2.toFixed(4),
        type: 'regression',
      });
    return metrics;
  }

  private calculateEthicalMetrics(
    modelInfo: ModelInfo,
  ): InsertMetricWithoutFeatureId[] {
    const metrics: InsertMetricWithoutFeatureId[] = [];
    if (modelInfo.demographicParity !== undefined)
      metrics.push({
        name: 'Demographic Parity',
        value: modelInfo.demographicParity.toFixed(2),
        type: 'ethical',
      });
    if (modelInfo.equalOpportunity !== undefined)
      metrics.push({
        name: 'Equal Opportunity',
        value: modelInfo.equalOpportunity.toFixed(2),
        type: 'ethical',
      });
    if (modelInfo.predictiveParity !== undefined)
      metrics.push({
        name: 'Predictive Parity',
        value: modelInfo.predictiveParity.toFixed(2),
        type: 'ethical',
      });
    return metrics;
  }

  private calculateTextQualityMetrics(
    generatedTexts: { id: string; text: string }[],
    expectedTexts: { id: string; text: string }[],
  ): InsertMetricWithoutFeatureId[] {
    const metrics: InsertMetricWithoutFeatureId[] = [];
    const perplexity = this.calculatePerplexity(
      generatedTexts.map((t) => t.text),
    );
    const bleuScore = this.calculateBleuScore(
      generatedTexts.map((t) => t.text),
      expectedTexts.map((t) => t.text),
    );
    const lexicalDiversity = this.calculateLexicalDiversity(
      generatedTexts.map((t) => t.text),
    );

    metrics.push({
      name: 'Perplexity',
      value: perplexity.toFixed(2) + ' bits', // La perplejidad no se expresa en porcentaje
      type: 'text_quality',
    });
    metrics.push({
      name: 'BLEU Score',
      value: (bleuScore * 100).toFixed(2) + '%',
      type: 'text_quality',
    });
    metrics.push({
      name: 'Lexical Diversity',
      value: (lexicalDiversity * 100).toFixed(2) + '%',
      type: 'text_quality',
    });
    return metrics;
  }

  private calculateRelevanceMetrics(
    generatedTexts: { id: string; text: string }[],
    expectedTexts: { id: string; text: string }[],
  ): InsertMetricWithoutFeatureId[] {
    const metrics: InsertMetricWithoutFeatureId[] = [];
    const responsePrecision = this.calculateResponsePrecision(
      generatedTexts.map((t) => t.text),
      expectedTexts.map((t) => t.text),
    );
    const responseCompleteness = this.calculateResponseCompleteness(
      generatedTexts.map((t) => t.text),
      expectedTexts.map((t) => t.text),
    );

    metrics.push({
      name: 'Response Precision',
      value: (responsePrecision * 100).toFixed(2) + '%',
      type: 'relevance',
    });
    metrics.push({
      name: 'Response Completeness',
      value: (responseCompleteness * 100).toFixed(2) + '%',
      type: 'relevance',
    });
    return metrics;
  }

  private calculatePerplexity(generatedTexts: string[]): number {
    const calculateSentencePerplexity = (sentence: string): number => {
      const words = sentence.split(/\s+/);
      const n = words.length;
      const wordFrequency: { [key: string]: number } = {};

      words.forEach((word) => {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      });

      let perplexity = 1;
      for (const word of words) {
        const probability = wordFrequency[word]! / n;
        perplexity *= Math.pow(1 / probability, 1 / n);
      }

      return perplexity;
    };

    const avgPerplexity =
      generatedTexts.reduce((sum, text) => {
        return sum + calculateSentencePerplexity(text);
      }, 0) / generatedTexts.length;

    return avgPerplexity;
  }

  private calculateBleuScore(
    generatedTexts: string[],
    expectedTexts: string[],
  ): number {
    const calculateSentenceBleu = (
      generated: string,
      reference: string,
    ): number => {
      const genWords = generated.toLowerCase().split(/\s+/);
      const refWords = reference.toLowerCase().split(/\s+/);

      let matches = 0;
      for (const word of genWords) {
        if (refWords.includes(word)) {
          matches++;
        }
      }

      const precision = matches / genWords.length;
      const brevityPenalty = Math.exp(1 - refWords.length / genWords.length);

      return brevityPenalty * precision;
    };

    const avgBleuScore =
      generatedTexts.reduce((sum, generatedText, index) => {
        return (
          sum + calculateSentenceBleu(generatedText, expectedTexts[index]!)
        );
      }, 0) / generatedTexts.length;

    return avgBleuScore;
  }

  private calculateLexicalDiversity(generatedTexts: string[]): number {
    const calculateTextDiversity = (text: string): number => {
      const words = text.toLowerCase().split(/\s+/);
      const uniqueWords = new Set(words);
      return uniqueWords.size / words.length;
    };

    const avgLexicalDiversity =
      generatedTexts.reduce((sum, text) => {
        return sum + calculateTextDiversity(text);
      }, 0) / generatedTexts.length;

    return avgLexicalDiversity;
  }

  private calculateResponsePrecision(
    generatedTexts: string[],
    expectedTexts: string[],
  ): number {
    const calculateCosineSimilarity = (
      text1: string,
      text2: string,
    ): number => {
      const getWordFrequency = (text: string): { [key: string]: number } => {
        const words = text.toLowerCase().split(/\s+/);
        const frequency: { [key: string]: number } = {};
        for (const word of words) {
          frequency[word] = (frequency[word] || 0) + 1;
        }
        return frequency;
      };

      const freq1 = getWordFrequency(text1);
      const freq2 = getWordFrequency(text2);
      const words = new Set([...Object.keys(freq1), ...Object.keys(freq2)]);

      let dotProduct = 0;
      let magnitude1 = 0;
      let magnitude2 = 0;

      for (const word of words) {
        const f1 = freq1[word] || 0;
        const f2 = freq2[word] || 0;
        dotProduct += f1 * f2;
        magnitude1 += f1 * f1;
        magnitude2 += f2 * f2;
      }

      return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
    };

    const avgPrecision =
      generatedTexts.reduce((sum, generatedText, index) => {
        const similarity = calculateCosineSimilarity(
          generatedText,
          expectedTexts[index]!,
        );
        return sum + similarity;
      }, 0) / generatedTexts.length;

    return avgPrecision;
  }

  private calculateResponseCompleteness(
    generatedTexts: string[],
    expectedTexts: string[],
  ): number {
    const avgCompleteness =
      generatedTexts.reduce((sum, generatedText, index) => {
        const expectedKeywords = new Set(
          expectedTexts[index]?.toLowerCase().split(/\s+/),
        );
        const generatedKeywords = new Set(
          generatedText.toLowerCase().split(/\s+/),
        );
        const coverageRatio =
          [...expectedKeywords].filter((keyword) =>
            generatedKeywords.has(keyword),
          ).length / expectedKeywords.size;
        return sum + coverageRatio;
      }, 0) / generatedTexts.length;
    return avgCompleteness;
  }

  private calculateSecurityMetrics(
    modelInfo: ModelInfo,
  ): InsertMetricWithoutFeatureId[] {
    const metrics: InsertMetricWithoutFeatureId[] = [];
    if (modelInfo.inappropriateContentRate !== undefined)
      metrics.push({
        name: 'Inappropriate Content Rate',
        value: modelInfo.inappropriateContentRate.toFixed(2) + '%',
        type: 'security',
      });
    if (modelInfo.robustnessScore !== undefined)
      metrics.push({
        name: 'Robustness Score',
        value: (modelInfo.robustnessScore * 100).toFixed(2) + '%',
        type: 'security',
      });
    return metrics;
  }

  private calculateSentimentAccuracy(confusionMatrixResult: {
    generatedTexts: { id: string; text: string }[];
    expectedTexts: { id: string; text: string }[];
  }): InsertMetricWithoutFeatureId[] {
    let correctSentiments = 0;
    const totalTexts = confusionMatrixResult.generatedTexts.length;
    let sentiment = new Sentiment();

    for (let i = 0; i < totalTexts; i++) {
      const generatedSentiment = sentiment.analyze(
        confusionMatrixResult.generatedTexts[i]?.text!,
      ).score;
      const expectedSentiment = sentiment.analyze(
        confusionMatrixResult.expectedTexts[i]?.text!,
      ).score;

      if (Math.sign(generatedSentiment) === Math.sign(expectedSentiment)) {
        correctSentiments++;
      }
    }

    const sentimentAccuracy = (correctSentiments / totalTexts) * 100;

    return [
      {
        name: 'Exactitud del Sentimiento',
        value: sentimentAccuracy.toFixed(2) + '%',
        type: 'sentiment',
      },
    ];
  }

  private calculateResponseTime(
    modelInfo?: ModelInfo,
  ): InsertMetricWithoutFeatureId[] {
    if (modelInfo?.inferenceTime !== undefined) {
      return [
        {
          name: 'Tiempo de Respuesta',
          value: modelInfo.inferenceTime.toFixed(2) + 'ms',
          type: 'performance',
        },
      ];
    }
    return [];
  }

  private calculateResponseConsistency(confusionMatrixResult: {
    generatedTexts: { id: string; text: string }[];
  }): InsertMetricWithoutFeatureId[] {
    const texts = confusionMatrixResult.generatedTexts.map((t) => t.text);
    const similarities: number[] = [];

    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 1; j < texts.length; j++) {
        similarities.push(
          this.calculateJaccardSimilarity(texts[i]!, texts[j]!),
        );
      }
    }

    const averageSimilarity =
      similarities.reduce((a, b) => a + b, 0) / similarities.length;
    const consistency = averageSimilarity * 100;

    return [
      {
        name: 'Consistencia de Respuesta',
        value: consistency.toFixed(2) + '%',
        type: 'consistency',
      },
    ];
  }

  private calculateJaccardSimilarity(text1: string, text2: string): number {
    const set1 = new Set(text1.toLowerCase().split(/\s+/));
    const set2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }
}

interface ModelInfo {
  latency?: number;
  throughput?: number;
  inferenceTime?: number;
  trainingTime?: number;
  memoryUsage?: number;
  diskUsage?: number;
  featureImportance?: Record<string, number>;
  shapValues?: number[];
  limeExplanation?: string;
  modelTransparency?: number;
  adversarialRobustness?: number;
  stability?: number;
  resilience?: number;
  crossValidationScore?: number;
  biasVarianceTradeoff?: number;
  overfittingUnderfittingDetection?: string;
  energyConsumption?: number;
  carbonFootprint?: number;
  modelSize?: number;
  parameterEfficiency?: number;
  fairness?: number;
  biasDetection?: number;
  disparateImpact?: number;
  riskOfError?: number;
  trustworthiness?: number;
  safety?: number;
  maintainability?: number;
  scalability?: number;
  reproducibility?: number;
  demographicParity?: number;
  equalOpportunity?: number;
  predictiveParity?: number;
  inappropriateContentRate?: number;
  robustnessScore?: number;
}

interface UserFeedback {
  satisfaction?: number;
  explainabilityRating?: number;
  easeOfUseRating?: number;
}

interface RegressionData {
  mse?: number;
  rmse?: number;
  mae?: number;
  r2?: number;
}
