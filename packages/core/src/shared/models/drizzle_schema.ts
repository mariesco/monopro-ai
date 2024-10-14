import {
  pgTable,
  varchar,
  serial,
  text,
  json,
  integer,
  timestamp,
  boolean,
  type AnyPgColumn,
  real,
} from 'drizzle-orm/pg-core';

export const AIStringTable = pgTable('ai_strings', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const AIPromptTable = pgTable('ai_prompts', {
  id: serial('id').primaryKey(),
  stringsIds: json('strings_ids').$type<number[]>().default([]).notNull(),
  featureId: integer('feature_id')
    .notNull()
    .references((): AnyPgColumn => FeatureTable.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const AIResponseTable = pgTable('ai_responses', {
  id: serial('id').primaryKey(),
  stringsIds: json('strings_ids').$type<number[]>().default([]).notNull(),
  promptId: integer('prompt_id')
    .notNull()
    .references((): AnyPgColumn => AIPromptTable.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const FeatureTable = pgTable('features', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  model: varchar('model', { length: 255 }).notNull(),
  url: varchar('url', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const ResponseClassTable = pgTable('response_classes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  featureId: integer('feature_id')
    .notNull()
    .references((): AnyPgColumn => FeatureTable.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const UseCaseTable = pgTable('use_cases', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  caseDescription: text('case_description').notNull(),
  promptId: integer('prompt_id')
    .notNull()
    .references((): AnyPgColumn => AIPromptTable.id),
  featureId: integer('feature_id')
    .notNull()
    .references((): AnyPgColumn => FeatureTable.id),
  responseClassExpectedId: integer('response_class_expected_id')
    .notNull()
    .references((): AnyPgColumn => ResponseClassTable.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const MetricsTable = pgTable('metrics', {
  id: serial('id').primaryKey(),
  featureId: integer('feature_id').references(() => FeatureTable.id),
  name: text('name'),
  type: text('type'),
  value: text('value'),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const ConfusionMatrixTable = pgTable('confusion_matrix', {
  id: serial('id').primaryKey(),
  promptId: integer('prompt_id').references(() => AIPromptTable.id),
  useCaseId: integer('use_case_id').references(() => UseCaseTable.id),
  truePositives: integer('true_positives').notNull(),
  falsePositives: integer('false_positives').notNull(),
  trueNegatives: integer('true_negatives').notNull(),
  falseNegatives: integer('false_negatives').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const AIProviderTable = pgTable('ai_providers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const AIModelTable = pgTable('ai_models', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  providerId: integer('provider_id')
    .notNull()
    .references((): AnyPgColumn => AIProviderTable.id),
  description: text('description'),
  capabilities: json('capabilities').$type<string[]>().default([]).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const AIModelConfigTable = pgTable('ai_model_configs', {
  id: serial('id').primaryKey(),
  modelId: integer('model_id')
    .notNull()
    .references((): AnyPgColumn => AIModelTable.id),
  maxTokens: integer('max_tokens'),
  temperature: real('temperature'),
  topP: real('top_p'),
  topK: integer('top_k'),
  presencePenalty: real('presence_penalty'),
  frequencyPenalty: real('frequency_penalty'),
  stopSequences: json('stop_sequences').$type<string[]>(),
  seed: integer('seed'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const AIModelBranchTable = pgTable('ai_model_branches', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  modelId: integer('model_id')
    .notNull()
    .references((): AnyPgColumn => AIModelTable.id),
  configId: integer('config_id')
    .notNull()
    .references((): AnyPgColumn => AIModelConfigTable.id),
  isProduction: boolean('is_production').notNull().default(false),
  featureId: integer('feature_id')
    .references((): AnyPgColumn => FeatureTable.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const AIModelPullRequestTable = pgTable('ai_model_pull_requests', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  sourceBranchId: integer('source_branch_id')
    .notNull()
    .references((): AnyPgColumn => AIModelBranchTable.id),
  targetBranchId: integer('target_branch_id')
    .notNull()
    .references((): AnyPgColumn => AIModelBranchTable.id),
  status: varchar('status', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
