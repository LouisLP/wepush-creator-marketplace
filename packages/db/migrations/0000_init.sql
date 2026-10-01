CREATE TYPE "public"."bid_status" AS ENUM('pending', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('beauty', 'fashion', 'fitness', 'food', 'gaming', 'tech', 'travel', 'lifestyle', 'finance', 'parenting');--> statement-breakpoint
CREATE TYPE "public"."loss_reason" AS ENUM('over_budget');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('tiktok', 'instagram');--> statement-breakpoint
CREATE TABLE "advertisers" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bids" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"fee_cents" bigint NOT NULL,
	"placed_at" timestamp with time zone NOT NULL,
	"followers" integer NOT NULL,
	"engagement_rate" double precision NOT NULL,
	"estimated_impressions" bigint NOT NULL,
	"effective_cpm_cents" bigint NOT NULL,
	"status" "bid_status" DEFAULT 'pending' NOT NULL,
	"score" double precision,
	"rank" integer,
	"loss_reason" "loss_reason",
	"score_factors" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bids_campaign_creator_unique" UNIQUE("campaign_id","creator_id"),
	CONSTRAINT "bids_fee_check" CHECK ("bids"."fee_cents" > 0),
	CONSTRAINT "bids_loss_reason_check" CHECK (("bids"."status" = 'lost') = ("bids"."loss_reason" is not null))
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"advertiser_id" uuid NOT NULL,
	"title" text NOT NULL,
	"brief" text NOT NULL,
	"platform" "platform" NOT NULL,
	"categories" "category"[] NOT NULL,
	"min_followers" integer NOT NULL,
	"min_engagement_rate" double precision,
	"budget_cents" bigint NOT NULL,
	"target_cpm_cents" bigint NOT NULL,
	"bidding_deadline" timestamp with time zone NOT NULL,
	"status" "campaign_status" DEFAULT 'open' NOT NULL,
	"spent_cents" bigint,
	"closed_at" timestamp with time zone,
	"scoring_version" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_budget_check" CHECK ("campaigns"."budget_cents" > 0),
	CONSTRAINT "campaigns_target_cpm_check" CHECK ("campaigns"."target_cpm_cents" > 0),
	CONSTRAINT "campaigns_categories_check" CHECK (cardinality("campaigns"."categories") > 0),
	CONSTRAINT "campaigns_spent_check" CHECK ("campaigns"."spent_cents" <= "campaigns"."budget_cents"),
	CONSTRAINT "campaigns_closed_check" CHECK (("campaigns"."status" = 'closed') = ("campaigns"."closed_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "creators" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"handle" text NOT NULL,
	"platform" "platform" NOT NULL,
	"category" "category" NOT NULL,
	"followers" integer NOT NULL,
	"engagement_rate" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creators_handle_unique" UNIQUE("handle"),
	CONSTRAINT "creators_followers_check" CHECK ("creators"."followers" >= 0),
	CONSTRAINT "creators_engagement_rate_check" CHECK ("creators"."engagement_rate" between 0 and 1)
);
--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_advertiser_id_advertisers_id_fk" FOREIGN KEY ("advertiser_id") REFERENCES "public"."advertisers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bids_creator_id_idx" ON "bids" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "campaigns_advertiser_id_idx" ON "campaigns" USING btree ("advertiser_id");--> statement-breakpoint
CREATE INDEX "campaigns_due_idx" ON "campaigns" USING btree ("bidding_deadline","id") WHERE "campaigns"."status" = 'open';