CREATE TABLE IF NOT EXISTS "rel_feature_model_branches" (
	"id" serial PRIMARY KEY NOT NULL,
	"feature_id" integer NOT NULL,
	"model_branch_id" integer NOT NULL,
	"is_production" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_model_branches" DROP CONSTRAINT "ai_model_branches_feature_id_features_id_fk";
--> statement-breakpoint
ALTER TABLE "ai_model_configs" DROP CONSTRAINT "ai_model_configs_model_id_ai_models_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rel_feature_model_branches" ADD CONSTRAINT "rel_feature_model_branches_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rel_feature_model_branches" ADD CONSTRAINT "rel_feature_model_branches_model_branch_id_ai_model_branches_id_fk" FOREIGN KEY ("model_branch_id") REFERENCES "public"."ai_model_branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "ai_model_branches" DROP COLUMN IF EXISTS "is_production";--> statement-breakpoint
ALTER TABLE "ai_model_branches" DROP COLUMN IF EXISTS "feature_id";--> statement-breakpoint
ALTER TABLE "ai_model_configs" DROP COLUMN IF EXISTS "model_id";