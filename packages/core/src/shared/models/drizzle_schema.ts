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

// export const UseCaseTable = pgTable('use_cases', {
//   id: serial('id').primaryKey(),
//   name: varchar('name', { length: 255 }).notNull(),
//   description: text('description').notNull(),
//   featureId: integer('feature_id').notNull().references((): AnyPgColumn => FeatureTable.id),
//   responseClassExpectedId: integer('response_class_expected_id').notNull().references((): AnyPgColumn => ResponseClassTable.id),
//   createdAt: timestamp('created_at').notNull().defaultNow(),
// });
