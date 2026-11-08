ALTER TABLE "cluster_results" ADD COLUMN "gaia_id_a" text NOT NULL;--> statement-breakpoint
ALTER TABLE "cluster_results" ADD COLUMN "gaia_id_b" text NOT NULL;--> statement-breakpoint
ALTER TABLE "cluster_results" ADD COLUMN "dist_a_pc" double precision NOT NULL;--> statement-breakpoint
ALTER TABLE "cluster_results" ADD COLUMN "dist_b_pc" double precision NOT NULL;--> statement-breakpoint
ALTER TABLE "cluster_results" ADD COLUMN "x_ref_a" double precision NOT NULL;--> statement-breakpoint
ALTER TABLE "cluster_results" ADD COLUMN "y_ref_a" double precision NOT NULL;--> statement-breakpoint
ALTER TABLE "cluster_results" ADD COLUMN "x_ref_b" double precision NOT NULL;--> statement-breakpoint
ALTER TABLE "cluster_results" ADD COLUMN "y_ref_b" double precision NOT NULL;--> statement-breakpoint
ALTER TABLE "cluster_results" ADD COLUMN "pm_x_a" double precision NOT NULL;--> statement-breakpoint
ALTER TABLE "cluster_results" ADD COLUMN "pm_y_a" double precision NOT NULL;--> statement-breakpoint
ALTER TABLE "cluster_results" ADD COLUMN "pm_x_b" double precision NOT NULL;--> statement-breakpoint
ALTER TABLE "cluster_results" ADD COLUMN "pm_y_b" double precision NOT NULL;--> statement-breakpoint
ALTER TABLE "cluster_results" ADD COLUMN "g_bp_a" double precision NOT NULL;--> statement-breakpoint
ALTER TABLE "cluster_results" ADD COLUMN "g_bp_b" double precision NOT NULL;--> statement-breakpoint
ALTER TABLE "cluster_results" ADD COLUMN "g_rp_a" double precision NOT NULL;--> statement-breakpoint
ALTER TABLE "cluster_results" ADD COLUMN "g_rp_b" double precision NOT NULL;