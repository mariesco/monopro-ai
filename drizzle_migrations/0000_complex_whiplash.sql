CREATE TABLE IF NOT EXISTS "ai_prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"strings_ids" text NOT NULL,
	"feature_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"strings_ids" text NOT NULL,
	"prompt_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_strings" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
