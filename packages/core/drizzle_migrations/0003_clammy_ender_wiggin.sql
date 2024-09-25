CREATE TABLE IF NOT EXISTS "confusion_matrix" (
	"id" serial PRIMARY KEY NOT NULL,
	"prompt_id" integer,
	"use_case_id" integer,
	"true_positives" integer NOT NULL,
	"false_positives" integer NOT NULL,
	"true_negatives" integer NOT NULL,
	"false_negatives" integer NOT NULL,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"feature_id" integer,
	"name" text,
	"type" text,
	"value" text,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "confusion_matrix" ADD CONSTRAINT "confusion_matrix_prompt_id_ai_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."ai_prompts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "confusion_matrix" ADD CONSTRAINT "confusion_matrix_use_case_id_use_cases_id_fk" FOREIGN KEY ("use_case_id") REFERENCES "public"."use_cases"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "metrics" ADD CONSTRAINT "metrics_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
