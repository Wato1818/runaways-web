CREATE TABLE "cluster_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"cluster_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"original_name" text NOT NULL,
	"label" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "cluster_images_cluster_idx" ON "cluster_images" ("cluster_id");--> statement-breakpoint
ALTER TABLE "cluster_images" ADD CONSTRAINT "cluster_images_cluster_id_clusters_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "clusters"("id") ON DELETE CASCADE;