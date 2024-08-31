import { pgTable, varchar, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const AIStringTable = pgTable('ai_strings', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const AIPromptTable = pgTable('ai_prompts', {
  id: serial('id').primaryKey(),
  stringsIds: text('strings_ids').notNull(),
  featureId: text('feature_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const AIResponseTable = pgTable('ai_responses', {
  id: serial('id').primaryKey(),
  stringsIds: text('strings_ids').notNull(),
  promptId: text('prompt_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const FeatureTable = pgTable('features', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  model: varchar('model', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
