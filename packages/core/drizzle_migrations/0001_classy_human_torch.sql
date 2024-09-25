CREATE TABLE IF NOT EXISTS "use_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"case_description" text NOT NULL,
	"prompt_id" integer NOT NULL,
	"feature_id" integer NOT NULL,
	"response_class_expected_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_prompt_id_ai_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."ai_prompts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_response_class_expected_id_response_classes_id_fk" FOREIGN KEY ("response_class_expected_id") REFERENCES "public"."response_classes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
