CREATE TABLE IF NOT EXISTS "website_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"link_id" integer,
	"content" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "website_content_chunks" (
	"id" serial PRIMARY KEY NOT NULL,
	"website_content_id" integer,
	"chunk" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "website_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"webpages" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "website_url" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
