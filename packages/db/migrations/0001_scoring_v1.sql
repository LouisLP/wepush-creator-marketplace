ALTER TYPE "public"."loss_reason" ADD VALUE 'requirements_not_met' BEFORE 'over_budget';--> statement-breakpoint
ALTER TYPE "public"."loss_reason" ADD VALUE 'fee_out_of_range' BEFORE 'over_budget';--> statement-breakpoint
ALTER TABLE "bids" ADD COLUMN "remaining_budget_cents" bigint;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_remaining_budget_check" CHECK ("bids"."remaining_budget_cents" >= 0);