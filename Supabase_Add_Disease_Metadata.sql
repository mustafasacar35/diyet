-- Add keyword_metadata column to disease_rules table
ALTER TABLE "public"."disease_rules" 
ADD COLUMN IF NOT EXISTS "keyword_metadata" jsonb DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN "public"."disease_rules"."keyword_metadata" IS 'Stores rich metadata (warning, info) for keywords. Format: {"keyword": {"warning": "...", "info": "..."}}';
