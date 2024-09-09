import {
  pgTable,
  varchar,
  serial,
  text,
  json,
  integer,
  timestamp,
  type AnyPgColumn,
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
