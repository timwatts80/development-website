-- Add missing type column to tasks table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'type'
    ) THEN
        ALTER TABLE "tasks" ADD COLUMN "type" text NOT NULL DEFAULT 'task';
    END IF;
END $$;
