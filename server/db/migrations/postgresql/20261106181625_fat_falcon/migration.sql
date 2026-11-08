CREATE TABLE "cluster_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"cluster_id" uuid NOT NULL,
	"star_a" integer NOT NULL,
	"star_b" integer NOT NULL,
	"angle" double precision NOT NULL,
	"tbt_a" double precision NOT NULL,
	"tbt_b" double precision NOT NULL,
	"tbt_diff" double precision NOT NULL,
	"v_a" double precision NOT NULL,
	"v_b" double precision NOT NULL,
	"v_ratio" double precision NOT NULL,
	"criteria_score" double precision NOT NULL,
	"tier" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clusters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL UNIQUE,
	"uploaded_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "cluster_results_pair_unique" ON "cluster_results" ("cluster_id","star_a","star_b");--> statement-breakpoint
CREATE INDEX "cluster_results_cluster_idx" ON "cluster_results" ("cluster_id");--> statement-breakpoint
CREATE INDEX "cluster_results_score_idx" ON "cluster_results" ("cluster_id","criteria_score");--> statement-breakpoint
ALTER TABLE "cluster_results" ADD CONSTRAINT "cluster_results_cluster_id_clusters_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "clusters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "clusters" ADD CONSTRAINT "clusters_uploaded_by_users_id_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL;